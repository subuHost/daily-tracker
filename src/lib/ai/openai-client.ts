import OpenAI from "openai";

/**
 * OpenAI Client Wrapper
 *
 * Creates an OpenAI client from either:
 * 1. A user-provided API key (from user_ai_settings table)
 * 2. A server-side environment variable (fallback)
 *
 * This mirrors the pattern in gemini-client.ts but for OpenAI.
 * The `openai` npm package is already installed but was never wired up.
 */

/**
 * Create an OpenAI client with the given API key.
 * The key should be retrieved server-side from user_ai_settings,
 * never exposed to the client.
 */
export function createOpenAIClient(apiKey: string): OpenAI {
    return new OpenAI({
        apiKey,
    });
}

/**
 * Get an OpenAI client using environment variable (server-side fallback).
 * Returns null if no key is configured.
 */
export function getOpenAIClient(): OpenAI | null {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return null;
    return createOpenAIClient(key);
}

/**
 * Generate a chat completion using OpenAI.
 */
export async function openaiChat(
    client: OpenAI,
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    options?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
    }
): Promise<string> {
    const response = await client.chat.completions.create({
        model: options?.model || "gpt-4o-mini",
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
    });

    return response.choices[0]?.message?.content || "";
}

/**
 * Generate a structured JSON response using OpenAI.
 */
export async function openaiJSON<T>(
    client: OpenAI,
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    options?: {
        model?: string;
        temperature?: number;
    }
): Promise<T> {
    const response = await client.chat.completions.create({
        model: options?.model || "gpt-4o-mini",
        messages,
        temperature: options?.temperature ?? 0.3,
        response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    return JSON.parse(content) as T;
}
