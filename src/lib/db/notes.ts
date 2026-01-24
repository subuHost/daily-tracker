import { createClient } from "@/lib/supabase/client";

export interface Note {
    id: string;
    user_id: string;
    title: string | null;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface NoteInput {
    title?: string | null;
    content: string;
}

// Fetch all notes
export async function getNotes(): Promise<Note[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
}

// Create a new note
export async function createNote(input: NoteInput): Promise<Note> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("notes")
        .insert({
            user_id: user.id,
            title: input.title || null,
            content: input.content,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Update a note
export async function updateNote(id: string, input: NoteInput): Promise<Note> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("notes")
        .update({
            title: input.title || null,
            content: input.content,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Delete a note
export async function deleteNote(id: string): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw error;
}
