import { createClient as createServerClient } from "@/lib/supabase/server";
import { UserAiSettings } from "./user-settings";

/**
 * Get user's AI settings (server-side)
 */
export async function getUserAiSettingsServer(): Promise<UserAiSettings | null> {
    const supabase = await createServerClient();

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
