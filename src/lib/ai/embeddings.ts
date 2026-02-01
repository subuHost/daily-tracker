"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

/**
 * Generate an embedding vector for a piece of text using Gemini.
 * Uses text-embedding-004 which produces 768-dimensional vectors.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    if (!genAI) {
        throw new Error("GEMINI_API_KEY is not configured");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);
        const embedding = result.embedding;

        return embedding.values;
    } catch (error: any) {
        console.error("Error generating embedding:", error);
        throw new Error(`Embedding generation failed: ${error.message}`);
    }
}
