import { createClient } from "@/lib/supabase/client";

export interface Task {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    priority: "low" | "medium" | "high";
    category_id: string | null;
    completed: boolean;
    completed_at: string | null;
    parent_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface TaskInput {
    title: string;
    description?: string | null;
    due_date?: string | null;
    priority?: "low" | "medium" | "high";
    category_id?: string | null;
}

// Fetch user's tasks
export async function getTasks(includeCompleted: boolean = true): Promise<Task[]> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    let query = supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (!includeCompleted) {
        query = query.eq("completed", false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

// Create a new task
export async function createTask(input: TaskInput, supabaseClient?: any): Promise<Task> {
    const supabase = supabaseClient || createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("tasks")
        .insert({
            user_id: user.id,
            title: input.title,
            description: input.description || null,
            due_date: input.due_date || null,
            priority: input.priority || "medium",
            category_id: input.category_id || null,
            completed: false,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Toggle task completion
export async function toggleTaskComplete(id: string): Promise<Task> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // First get the current state
    const { data: existing, error: fetchError } = await supabase
        .from("tasks")
        .select("completed")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (fetchError) throw fetchError;

    const newCompleted = !existing.completed;

    const { data, error } = await supabase
        .from("tasks")
        .update({
            completed: newCompleted,
            completed_at: newCompleted ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Delete a task
export async function deleteTask(id: string): Promise<void> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw error;
}
