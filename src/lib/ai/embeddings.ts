"use server";

import { getGeminiClient, hasApiKeys } from "@/lib/ai/gemini-client";

/**
 * Generate an embedding vector for a piece of text using Gemini.
 * Uses text-embedding-004 which produces 768-dimensional vectors.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    if (!hasApiKeys()) {
        throw new Error("GEMINI_API_KEY is not configured");
    }

    try {
        const genAI = getGeminiClient()!;
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);
        const embedding = result.embedding;

        return embedding.values;
    } catch (error: any) {
        console.error("Error generating embedding:", error);
        throw new Error(`Embedding generation failed: ${error.message}`);
    }
}
