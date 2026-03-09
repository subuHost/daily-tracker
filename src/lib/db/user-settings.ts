import { createClient } from "@/lib/supabase/client";


export type PreferredModel =
    | 'gemini-flash'
    | 'gemini-pro'
    | 'gpt-4o'
    | 'gpt-4o-mini'
    | 'claude-3-5-sonnet'
    | 'claude-3-haiku'
    | 'grok-2'
    | 'grok-2-mini';

export interface UserAiSettings {
    id: string;
    user_id: string;
    openai_api_key: string | null;
    perplexity_api_key: string | null;
    claude_api_key: string | null;
    grok_api_key: string | null;
    preferred_model: PreferredModel | "gemini" | "openai" | "perplexity"; // Keeping backwards compatible types
    created_at: string;
    updated_at: string;
}

export interface UserAiSettingsInput {
    openai_api_key?: string | null;
    perplexity_api_key?: string | null;
    claude_api_key?: string | null;
    grok_api_key?: string | null;
    preferred_model?: PreferredModel;
}

/**
 * Get user's AI settings (client-side)
 */
export async function getUserAiSettings(): Promise<UserAiSettings | null> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("user_ai_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
}



/**
 * Upsert user's AI settings.
 */
export async function upsertUserAiSettings(input: UserAiSettingsInput): Promise<UserAiSettings> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("user_ai_settings")
        .upsert(
            {
                user_id: user.id,
                ...input,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Delete user's AI settings.
 */
export async function deleteUserAiSettings(): Promise<void> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("user_ai_settings")
        .delete()
        .eq("user_id", user.id);

    if (error) throw error;
}

/**
 * Check if user has a specific AI provider key configured.
 */
export async function hasAiProviderKey(provider: "openai" | "perplexity" | "claude" | "grok"): Promise<boolean> {
    const settings = await getUserAiSettings();
    if (!settings) return false;

    if (provider === "openai") return !!settings.openai_api_key;
    if (provider === "perplexity") return !!settings.perplexity_api_key;
    if (provider === "claude") return !!settings.claude_api_key;
    if (provider === "grok") return !!settings.grok_api_key;
    return false;
}
