/**
 * Perplexity Client Wrapper
 *
 * Perplexity uses an OpenAI-compatible API, so we reuse the OpenAI SDK
 * with a custom base URL. This gives us search-augmented AI responses
 * for the stock research agent.
 *
 * Key differences from standard OpenAI:
 * - Base URL: https://api.perplexity.ai
 * - Models: "sonar", "sonar-pro", "sonar-reasoning"
 * - Responses include citations from web search
 */

import OpenAI from "openai";

/**
 * Create a Perplexity client with the given API key.
 * Uses OpenAI SDK with custom base URL since Perplexity is API-compatible.
 */
export function createPerplexityClient(apiKey: string): OpenAI {
    return new OpenAI({
        apiKey,
        baseURL: "https://api.perplexity.ai",
    });
}

/**
 * Get a Perplexity client using environment variable (server-side fallback).
 */
export function getPerplexityClient(): OpenAI | null {
    const key = process.env.PERPLEXITY_API_KEY;
    if (!key) return null;
    return createPerplexityClient(key);
}

export interface PerplexitySearchResult {
    content: string;
    citations: string[];
}

/**
 * Search the web for information using Perplexity.
 * This is the primary use case for the research agent — getting fresh
 * news and market data with citations.
 */
export async function perplexitySearch(
    client: OpenAI,
    query: string,
    options?: {
        model?: string;
        temperature?: number;
    }
): Promise<PerplexitySearchResult> {
    const response = await client.chat.completions.create({
        model: options?.model || "sonar",
        messages: [
            {
                role: "system",
                content:
                    "You are a financial research assistant. Provide detailed, factual market analysis with specific data points. Focus on recent news, earnings, analyst opinions, and market trends.",
            },
            {
                role: "user",
                content: query,
            },
        ],
        temperature: options?.temperature ?? 0.2,
    });

    const content = response.choices[0]?.message?.content || "";

    // Perplexity returns citations in the response metadata
    // The exact format depends on the API version
    const citations: string[] = (response as any).citations || [];

    return {
        content,
        citations,
    };
}
