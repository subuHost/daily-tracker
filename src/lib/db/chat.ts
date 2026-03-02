import { createClient } from "@/lib/supabase/client";

export interface ChatMessage {
    id: string;
    user_id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
}

// Fetch chat history for the current user, ordered oldest-first
export async function getChatHistory(supabaseClient?: any, limit: number = 50): Promise<ChatMessage[]> {
    const supabase = supabaseClient || createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

// Save a single chat message for the current user
export async function saveChatMessage(role: "user" | "assistant", content: string, supabaseClient?: any): Promise<ChatMessage> {
    const supabase = supabaseClient || createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("chat_messages")
        .insert({
            user_id: user.id,
            role,
            content,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Delete all chat messages for the current user
export async function clearChatHistory(supabaseClient?: any): Promise<void> {
    const supabase = supabaseClient || createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("user_id", user.id);

    if (error) throw error;
}
