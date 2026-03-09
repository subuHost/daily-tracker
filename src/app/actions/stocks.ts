"use server";

import { getUserAiSettingsServer } from "@/lib/db/user-settings.server";
import { getGeminiClient, getCurrentKey, markKeyFailed } from "@/lib/ai/gemini-client";
import { createOpenAIClient, openaiChat } from "@/lib/ai/openai-client";
import { createPerplexityClient, perplexitySearch } from "@/lib/ai/perplexity-client";

// ─── Exchange Detection Helpers ─────────────────────────────────

const KNOWN_NSE_SYMBOLS = new Set([
    'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'HINDUNILVR', 'BHARTIARTL', 'ITC',
    'KOTAKBANK', 'LT', 'AXISBANK', 'SBIN', 'ASIANPAINT', 'BAJFINANCE', 'MARUTI', 'HCLTECH'
]);

function detectExchange(symbol: string): 'NSE' | 'BSE' | 'US' {
    const s = symbol.toUpperCase();
    if (s.endsWith('.NS')) return 'NSE';
    if (s.endsWith('.BO')) return 'BSE';
    if (KNOWN_NSE_SYMBOLS.has(s)) return 'NSE';
    return 'US';
}

function ensureExchangeSuffix(symbol: string, exchange: 'NSE' | 'BSE'): string {
    const s = symbol.toUpperCase();
    if (s.endsWith('.NS') || s.endsWith('.BO')) return symbol;
    return exchange === 'NSE' ? `${symbol}.NS` : `${symbol}.BO`;
}

// ─── Yahoo Finance API ──────────────────────────────────────────

/**
 * Fetch a quote from Yahoo Finance (for Indian stocks).
 */
async function fetchYahooQuote(yahooSymbol: string, originalSymbol: string): Promise<StockQuote | null> {
    try {
        const res = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}`,
            {
                next: { revalidate: 30 },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            }
        );

        if (!res.ok) return null;

        const data = await res.json();
        const result = data.chart?.result?.[0];
        if (!result || !result.meta) return null;

        const meta = result.meta;
        const current = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose || meta.previousClose;

        return {
            symbol: originalSymbol,
            current,
            high: meta.regularMarketDayHigh,
            low: meta.regularMarketDayLow,
            open: meta.regularMarketOpen,
            previousClose,
            change: current - previousClose,
            changePercent: ((current - previousClose) / previousClose) * 100,
            timestamp: meta.regularMarketTime,
        };
    } catch (error) {
        console.error(`Yahoo quote error for ${yahooSymbol}:`, error);
        return null;
    }
}

/**
 * Fetch candles from Yahoo Finance.
 */
async function fetchYahooCandles(yahooSymbol: string, from: number, to: number): Promise<StockCandle | null> {
    try {
        const res = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&period1=${from}&period2=${to}`,
            {
                next: { revalidate: 300 },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            }
        );

        if (!res.ok) return null;

        const data = await res.json();
        const result = data.chart?.result?.[0];
        if (!result || !result.timestamp) return null;

        const quote = result.indicators?.quote?.[0];
        if (!quote) return null;

        return {
            open: quote.open || [],
            high: quote.high || [],
            low: quote.low || [],
            close: quote.close || [],
            volume: quote.volume || [],
            timestamp: result.timestamp || [],
        };
    } catch (error) {
        console.error(`Yahoo candle error for ${yahooSymbol}:`, error);
        return null;
    }
}

// ─── Finnhub API ────────────────────────────────────────────────


const FINNHUB_BASE = "https://finnhub.io/api/v1";

function getFinnhubKey(): string {
    const key = process.env.FINNHUB_API_KEY;
    if (!key) throw new Error("FINNHUB_API_KEY is not configured");
    return key;
}

export interface StockQuote {
    symbol: string;
    current: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
    change: number;
    changePercent: number;
    timestamp: number;
}

/**
 * Fetch a real-time stock quote from Finnhub.
 */
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
    const exchange = detectExchange(symbol);

    if (exchange !== 'US') {
        return fetchYahooQuote(ensureExchangeSuffix(symbol, exchange), symbol);
    }

    try {
        const key = getFinnhubKey();
        const res = await fetch(
            `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`,
            { next: { revalidate: 30 } } // Cache for 30 seconds
        );

        if (!res.ok) {
            console.error(`Finnhub quote error for ${symbol}: ${res.status}`);
            return null;
        }

        const data = await res.json();

        // Finnhub returns c=0 when symbol is not found
        if (!data.c || data.c === 0) return null;

        return {
            symbol,
            current: data.c,
            high: data.h,
            low: data.l,
            open: data.o,
            previousClose: data.pc,
            change: data.d,
            changePercent: data.dp,
            timestamp: data.t,
        };
    } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error);
        return null;
    }
}

/**
 * Fetch quotes for multiple symbols (batched).
 */
export async function getStockQuotes(
    symbols: string[]
): Promise<Record<string, StockQuote>> {
    const results: Record<string, StockQuote> = {};

    // Finnhub free tier: 60 calls/minute. Batch carefully.
    const promises = symbols.map(async (symbol) => {
        const quote = await getStockQuote(symbol);
        if (quote) results[symbol] = quote;
    });

    await Promise.all(promises);
    return results;
}

export interface StockCandle {
    open: number[];
    high: number[];
    low: number[];
    close: number[];
    volume: number[];
    timestamp: number[];
}

/**
 * Fetch historical candle data from Finnhub.
 * Resolution: D (daily), W (weekly), M (monthly)
 */
export async function getStockCandles(
    symbol: string,
    resolution: string = "D",
    from?: number,
    to?: number
): Promise<StockCandle | null> {
    const exchange = detectExchange(symbol);
    const now = Math.floor(Date.now() / 1000);
    const fromTs = from || now - 365 * 24 * 60 * 60; // Default: 1 year
    const toTs = to || now;

    if (exchange !== 'US') {
        return fetchYahooCandles(ensureExchangeSuffix(symbol, exchange), fromTs, toTs);
    }

    try {
        const key = getFinnhubKey();

        const res = await fetch(
            `${FINNHUB_BASE}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${fromTs}&to=${toTs}&token=${key}`,
            { next: { revalidate: 300 } } // Cache for 5 min
        );

        if (!res.ok) return null;

        const data = await res.json();

        if (data.s === "no_data") return null;

        return {
            open: data.o || [],
            high: data.h || [],
            low: data.l || [],
            close: data.c || [],
            volume: data.v || [],
            timestamp: data.t || [],
        };
    } catch (error) {
        console.error(`Failed to fetch candles for ${symbol}:`, error);
        return null;
    }
}

export interface CompanyProfile {
    name: string;
    ticker: string;
    exchange: string;
    industry: string;
    logo: string;
    weburl: string;
    marketCap: number;
    country: string;
    currency: string;
}

/**
 * Fetch company profile from Finnhub.
 */
export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
    try {
        const key = getFinnhubKey();
        const res = await fetch(
            `${FINNHUB_BASE}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${key}`,
            { next: { revalidate: 86400 } } // Cache for 24 hours
        );

        if (!res.ok) return null;

        const data = await res.json();
        if (!data.name) return null;

        return {
            name: data.name,
            ticker: data.ticker,
            exchange: data.exchange,
            industry: data.finnhubIndustry,
            logo: data.logo,
            weburl: data.weburl,
            marketCap: data.marketCapitalization,
            country: data.country,
            currency: data.currency,
        };
    } catch (error) {
        console.error(`Failed to fetch profile for ${symbol}:`, error);
        return null;
    }
}

/**
 * Search for stock symbols via Finnhub.
 */
export async function searchSymbol(
    query: string
): Promise<{ symbol: string; description: string; type: string }[]> {
    try {
        const key = getFinnhubKey();
        const res = await fetch(
            `${FINNHUB_BASE}/search?q=${encodeURIComponent(query)}&token=${key}`,
            { next: { revalidate: 60 } }
        );

        if (!res.ok) return [];

        const data = await res.json();
        return (data.result || [])
            .slice(0, 10)
            .map((r: any) => ({
                symbol: r.symbol,
                description: r.description,
                type: r.type,
            }));
    } catch (error) {
        console.error(`Symbol search failed for "${query}":`, error);
        return [];
    }
}

// ─── Research Agent ─────────────────────────────────────────────

export interface ResearchReport {
    summary: string;
    sentiment: "bullish" | "bearish" | "neutral";
    keyPoints: string[];
    risks: string[];
    catalysts: string[];
    citations: string[];
    provider: string; // Which AI provider generated this
}

/**
 * Stock Research Agent — Multi-step AI pipeline.
 *
 * Step 1: Use Perplexity to search for recent news and data (if key available)
 * Step 2: Use GPT-4o or Gemini to synthesize an analysis report
 *
 * Graceful degradation:
 * - If Perplexity key missing → skip news search, use Gemini with web grounding
 * - If OpenAI key missing → use Gemini for analysis
 * - If all fail → return error
 */
export async function generateStockResearch(
    symbol: string,
    companyName?: string,
    modelId?: string
): Promise<ResearchReport> {
    const settings = await getUserAiSettingsServer().catch(() => null);
    const { ModelRouter } = await import("@/lib/ai/model-router");
    const config = ModelRouter.resolveConfig(modelId ?? settings?.preferred_model ?? 'gemini-flash', settings);

    let newsContent = "";
    let citations: string[] = [];
    let provider = "gemini";

    // Step 1: Try Perplexity for web-search-augmented news
    if (settings?.perplexity_api_key) {
        try {
            const perplexity = createPerplexityClient(settings.perplexity_api_key);
            const result = await perplexitySearch(
                perplexity,
                `Latest news, earnings, analyst ratings, and market sentiment for ${companyName || symbol} (${symbol}). Include specific numbers, dates, and price targets.`
            );
            newsContent = result.content;
            citations = result.citations;
        } catch (error) {
            console.error("Perplexity search failed, falling back:", error);
        }
    }

    // Step 2: Generate analysis report
    const analysisPrompt = `Analyze the following stock and provide a structured investment research report.

Stock: ${companyName || symbol} (${symbol})

${newsContent ? `Recent News & Data:\n${newsContent}` : "No recent news data available. Use your general knowledge."}

Respond in JSON format with this exact structure:
{
  "summary": "2-3 sentence executive summary",
  "sentiment": "bullish" | "bearish" | "neutral",
  "keyPoints": ["point 1", "point 2", ...],
  "risks": ["risk 1", "risk 2", ...],
  "catalysts": ["catalyst 1", "catalyst 2", ...]
}`;

    try {
        const systemPrompt = "You are a senior equity research analyst. Provide factual, data-driven analysis. Always respond ONLY with valid JSON.";
        const responseText = await ModelRouter.chat(config, [{ role: "user", content: analysisPrompt }], systemPrompt);

        // Clean potential markdown wrapping
        const cleanJson = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        provider = config.provider;
        return { ...parsed, citations, provider };
    } catch (error) {
        console.error("AI analysis failed:", error);

        // Return a default report if everything fails
        return {
            summary: `Unable to generate research report for ${symbol}: ${(error as Error).message}. Please check your AI API key configuration in Settings.`,
            sentiment: "neutral",
            keyPoints: ["Research report generation failed. Please try again later."],
            risks: [],
            catalysts: [],
            citations: [],
            provider: "none",
        };
    }
}
