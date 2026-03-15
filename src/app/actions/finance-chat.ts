"use server";

import { getUserAiSettingsServer } from "@/lib/db/user-settings.server";
import { ModelRouter } from "@/lib/ai/model-router";
import { createPerplexityClient, perplexitySearch } from "@/lib/ai/perplexity-client";
import { getStockQuotes, type StockQuote } from "./stocks";
import type { Message } from "./ai";

// ─── Finance Chat System Prompt ──────────────────────────────────

function buildFinanceSystemPrompt(
    portfolioContext: string,
    watchlistContext: string,
    deepResearchData?: string
): string {
    return `You are an expert AI finance assistant for an Indian investor using the "Daily Tracker" app.
You have deep knowledge of Indian stock markets (NSE/BSE), global markets, mutual funds, and personal finance.

IMPORTANT GUIDELINES:
- Provide data-driven, factual analysis
- Use INR (₹) as the primary currency
- Reference specific numbers, percentages, and dates when available
- Be clear about what is factual data vs. your analysis/opinion
- Always mention: "This is not financial advice. Please consult a qualified financial advisor before making investment decisions."

USER'S PORTFOLIO:
${portfolioContext || "No investments tracked yet."}

USER'S WATCHLIST:
${watchlistContext || "No watchlist items yet."}

${deepResearchData ? `\nLATEST MARKET RESEARCH DATA:\n${deepResearchData}\n\nUse this fresh research data to provide up-to-date insights. Cite sources when possible.` : ""}

Answer the user's questions about their portfolio, market trends, stock analysis, investment strategies, and personal finance.
If they ask about a specific stock, provide detailed analysis including fundamentals, technicals, and recent news if available.`;
}

// ─── Build Portfolio Context String ───────────────────────────────

interface PortfolioData {
    investments: Array<{
        symbol: string;
        name: string | null;
        buy_price: number;
        quantity: number;
        buy_date: string;
        current_price: number | null;
        type: string;
    }>;
    quotes: Record<string, StockQuote>;
}

function buildPortfolioContext(data: PortfolioData): string {
    if (data.investments.length === 0) return "No investments tracked.";

    let totalInvested = 0;
    let totalCurrent = 0;
    const lines: string[] = [];

    for (const inv of data.investments) {
        const currentPrice = data.quotes[inv.symbol]?.current || inv.current_price || 0;
        const invested = inv.buy_price * inv.quantity;
        const current = currentPrice * inv.quantity;
        const pnl = current - invested;
        const pnlPct = invested > 0 ? ((pnl / invested) * 100).toFixed(1) : "0.0";

        totalInvested += invested;
        totalCurrent += current;

        lines.push(
            `- ${inv.name || inv.symbol} (${inv.symbol}): ${inv.quantity} units @ ₹${inv.buy_price.toFixed(2)} → ₹${currentPrice.toFixed(2)} | P&L: ₹${pnl.toFixed(0)} (${pnlPct}%)`
        );
    }

    const overallPnl = totalCurrent - totalInvested;
    const overallPnlPct = totalInvested > 0 ? ((overallPnl / totalInvested) * 100).toFixed(1) : "0.0";

    return [
        `Total Invested: ₹${totalInvested.toLocaleString("en-IN")} | Current Value: ₹${totalCurrent.toLocaleString("en-IN")} | P&L: ₹${overallPnl.toLocaleString("en-IN")} (${overallPnlPct}%)`,
        "",
        "Holdings:",
        ...lines,
    ].join("\n");
}

// ─── Build Watchlist Context String ───────────────────────────────

interface WatchlistData {
    items: Array<{
        symbol: string;
        name: string | null;
        exchange: string;
        type: string;
        notes: string | null;
    }>;
    quotes: Record<string, StockQuote>;
}

function buildWatchlistContext(data: WatchlistData): string {
    if (data.items.length === 0) return "No watchlist items.";

    const lines = data.items.map((item) => {
        const quote = data.quotes[item.symbol];
        const priceInfo = quote
            ? `₹${quote.current.toFixed(2)} (${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%)`
            : "Price unavailable";
        return `- ${item.name || item.symbol} (${item.symbol}.${item.exchange === "BSE" ? "BO" : "NS"}) — ${priceInfo}${item.notes ? ` | Note: ${item.notes}` : ""}`;
    });

    return lines.join("\n");
}

// ─── Main Finance Chat Action ─────────────────────────────────────

export async function financeChatAction(
    content: string,
    history: Message[],
    modelId: string = "gemini-flash",
    deepResearch: boolean = false
): Promise<{ reply: string; citations: string[] }> {
    const settings = await getUserAiSettingsServer().catch(() => null);

    // Dynamically import client-side DB functions (they use createClient from supabase/client)
    // For server actions we need the server supabase
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Fetch portfolio data
    const { data: investments } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", user.id)
        .is("sell_date", null)
        .order("created_at", { ascending: false });

    // Fetch watchlist data
    const { data: watchlistItems } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    // Gather all symbols for quote fetching
    const allSymbols = new Set<string>();
    const suffixMap: Record<string, string> = {};

    for (const inv of investments || []) {
        const sym = inv.symbol.toUpperCase();
        // Try with .NS suffix for Indian stocks
        const yahooSym = sym.endsWith(".NS") || sym.endsWith(".BO") ? sym : `${sym}.NS`;
        allSymbols.add(yahooSym);
        suffixMap[yahooSym] = sym;
    }

    for (const item of watchlistItems || []) {
        let yahooSymbol = item.symbol;
        if (item.exchange === "NSE") yahooSymbol = `${item.symbol}.NS`;
        else if (item.exchange === "BSE") yahooSymbol = `${item.symbol}.BO`;
        allSymbols.add(yahooSymbol);
        suffixMap[yahooSymbol] = item.symbol;
    }

    // Fetch all quotes in batch
    const rawQuotes = await getStockQuotes(Array.from(allSymbols));
    const quotes: Record<string, StockQuote> = {};
    for (const [key, quote] of Object.entries(rawQuotes)) {
        const originalSymbol = suffixMap[key] || key;
        quotes[originalSymbol] = quote;
    }

    // Build context strings
    const portfolioContext = buildPortfolioContext({
        investments: (investments || []).map((inv: any) => ({
            symbol: inv.symbol,
            name: inv.name,
            buy_price: Number(inv.buy_price),
            quantity: Number(inv.quantity),
            buy_date: inv.buy_date,
            current_price: inv.current_price ? Number(inv.current_price) : null,
            type: inv.type,
        })),
        quotes,
    });

    const watchlistContext = buildWatchlistContext({
        items: (watchlistItems || []).map((item: any) => ({
            symbol: item.symbol,
            name: item.name,
            exchange: item.exchange || "NSE",
            type: item.type,
            notes: item.notes,
        })),
        quotes,
    });

    // Deep Research: web search for latest data
    let deepResearchData = "";
    let citations: string[] = [];

    if (deepResearch && settings?.perplexity_api_key) {
        try {
            const perplexity = createPerplexityClient(settings.perplexity_api_key);

            // Extract stock symbols mentioned in the message or use all portfolio symbols
            const allStockNames = [
                ...(investments || []).map((i: any) => i.name || i.symbol),
                ...(watchlistItems || []).map((i: any) => i.name || i.symbol),
            ].filter(Boolean).slice(0, 10);

            const searchQuery = allStockNames.length > 0
                ? `Latest market news, earnings, analyst ratings, and significant developments for Indian stocks: ${allStockNames.join(", ")}. Include price movements, corporate actions, and market sentiment. Focus on the last 7 days.`
                : `Latest Indian stock market news, Nifty 50 and Sensex updates, significant market developments. User's question: ${content}`;

            const result = await perplexitySearch(perplexity, searchQuery);
            deepResearchData = result.content;
            citations = result.citations || [];
        } catch (error) {
            console.error("Deep research Perplexity search failed:", error);
        }
    }

    // Resolve model — for deep research, prefer a thinking-tier model
    let effectiveModelId = modelId;
    if (deepResearch) {
        // Upgrade to a thinking-tier model if available
        const thinkingModels = ["gemini-pro", "gpt-4o", "claude-3-5-sonnet", "grok-2"];
        const availableModels = ModelRouter.getAvailableModels(settings);
        const availableThinking = thinkingModels.find(m =>
            availableModels.find(am => am.id === m && am.available)
        );
        if (availableThinking) effectiveModelId = availableThinking;
    }

    const config = ModelRouter.resolveConfig(effectiveModelId, settings);

    // Build system prompt with all context
    const systemPrompt = buildFinanceSystemPrompt(portfolioContext, watchlistContext, deepResearchData);

    // Build message history
    const fullHistory: Message[] = [
        ...history,
        { role: "user", content },
    ];

    try {
        const reply = await ModelRouter.chat(config, fullHistory, systemPrompt);

        // Append citation note if deep research was used
        let finalReply = reply;
        if (citations.length > 0) {
            finalReply += "\n\n---\n**Sources:**\n" + citations.map((c, i) => `${i + 1}. ${c}`).join("\n");
        }

        return { reply: finalReply, citations };
    } catch (error) {
        console.error("Finance chat error:", error);
        return {
            reply: `I encountered an error generating a response: ${(error as Error).message}. Please check your AI API key configuration in Settings.`,
            citations: [],
        };
    }
}
