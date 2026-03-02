"use server";

import { createClient } from "@/lib/supabase/server";

export interface UserPreferences {
    user_id: string;
    widget_order: string[] | null;
    hidden_widgets: string[] | null;
    calorie_goal: number;
    protein_goal: number;
    updated_at: string;
}

const DEFAULT_PREFERENCES: Omit<UserPreferences, "user_id" | "updated_at"> = {
    widget_order: null,
    hidden_widgets: null,
    calorie_goal: 2000,
    protein_goal: 150,
};

export async function getUserPreferences(): Promise<UserPreferences | null> {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (error && error.code !== "PGRST116") {
        console.error("Failed to get user preferences:", error);
        return null;
    }

    // Return defaults if no preferences row exists
    if (!data) {
        return {
            user_id: user.id,
            ...DEFAULT_PREFERENCES,
            updated_at: new Date().toISOString(),
        };
    }

    return data;
}

export async function saveUserPreferences(
    updates: Partial<Pick<UserPreferences, "widget_order" | "hidden_widgets" | "calorie_goal" | "protein_goal">>
): Promise<UserPreferences | null> {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from("user_preferences")
        .upsert(
            {
                user_id: user.id,
                ...updates,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
        )
        .select()
        .single();

    if (error) {
        console.error("Failed to save user preferences:", error);
        return null;
    }

    return data;
}
