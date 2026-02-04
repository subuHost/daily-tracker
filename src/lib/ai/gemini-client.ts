import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Multi-API Key Support for Gemini with Retry Logic
 * 
 * This module provides key rotation to distribute API calls across multiple
 * Gemini API keys and automatic retry with different keys on quota errors.
 * 
 * IMPORTANT: For effective load distribution, each API key should be from
 * a DIFFERENT Google Cloud project. Keys from the same project share quota!
 * 
 * Add keys in .env.local as:
 *   GEMINI_API_KEY=key1 (from project 1)
 *   GEMINI_API_KEY_2=key2 (from project 2)
 *   GEMINI_API_KEY_3=key3 (from project 3)
 */

// Collect all available API keys
function getApiKeys(): string[] {
    const keys: string[] = [];

    // Primary key
    if (process.env.GEMINI_API_KEY) {
        keys.push(process.env.GEMINI_API_KEY);
    }

    // Additional keys (GEMINI_API_KEY_2 through GEMINI_API_KEY_10)
    for (let i = 2; i <= 10; i++) {
        const key = process.env[`GEMINI_API_KEY_${i}`];
        if (key) {
            keys.push(key);
        }
    }

    return keys;
}

// Track failed keys to skip them temporarily
const failedKeys: Map<string, number> = new Map();
const FAILURE_EXPIRY_MS = 60000; // 1 minute cooldown for failed keys

// Round-robin counter for key rotation
let currentKeyIndex = 0;

/**
 * Get an available API key, skipping recently failed ones.
 */
function getNextAvailableKey(): string | null {
    const keys = getApiKeys();
    if (keys.length === 0) return null;

    const now = Date.now();

    // Try each key starting from current index
    for (let i = 0; i < keys.length; i++) {
        const index = (currentKeyIndex + i) % keys.length;
        const key = keys[index];

        const failedAt = failedKeys.get(key);
        if (!failedAt || (now - failedAt) > FAILURE_EXPIRY_MS) {
            // Key is available (not failed or cooldown expired)
            currentKeyIndex = (index + 1) % keys.length;
            failedKeys.delete(key); // Clear if cooldown expired
            return key;
        }
    }

    // All keys are on cooldown, just use the next one anyway
    const key = keys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    return key;
}

/**
 * Mark a key as failed (quota exceeded).
 */
export function markKeyFailed(key: string): void {
    failedKeys.set(key, Date.now());
}

/**
 * Get a Gemini client with automatic key rotation.
 * Skips keys that recently failed with quota errors.
 */
export function getGeminiClient(): GoogleGenerativeAI | null {
    const key = getNextAvailableKey();

    if (!key) {
        console.error("No Gemini API keys configured");
        return null;
    }

    // Store the current key for potential failure marking
    (global as any).__currentGeminiKey = key;

    return new GoogleGenerativeAI(key);
}

/**
 * Get the currently active key (for marking as failed).
 */
export function getCurrentKey(): string | null {
    return (global as any).__currentGeminiKey || null;
}

/**
 * Get the total number of configured API keys.
 */
export function getKeyCount(): number {
    return getApiKeys().length;
}

/**
 * Check if any API keys are configured.
 */
export function hasApiKeys(): boolean {
    return getApiKeys().length > 0;
}

/**
 * Get status of all keys (for debugging).
 */
export function getKeyStatus(): { total: number; available: number; failed: number } {
    const keys = getApiKeys();
    const now = Date.now();
    let available = 0;
    let failed = 0;

    for (const key of keys) {
        const failedAt = failedKeys.get(key);
        if (!failedAt || (now - failedAt) > FAILURE_EXPIRY_MS) {
            available++;
        } else {
            failed++;
        }
    }

    return { total: keys.length, available, failed };
}
