"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================
// EXPENSE ACTIONS
// ============================================

export async function createExpenseAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const description = formData.get("description") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const category_id = formData.get("category_id") as string | null;
    const date = formData.get("date") as string;
    const note = formData.get("note") as string | null;

    const { error } = await supabase
        .from("transactions")
        .insert({
            user_id: user.id,
            type: "expense",
            amount,
            description,
            category_id: category_id || null,
            date,
            note: note || null,
        });

    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath("/finance");
    revalidatePath("/finance/expenses");
}

// ============================================
// TASK ACTIONS
// ============================================

export async function createTaskAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const due_date = formData.get("due_date") as string | null;
    const priority = (formData.get("priority") as string) || "medium";

    const { error } = await supabase
        .from("tasks")
        .insert({
            user_id: user.id,
            title,
            description: description || null,
            due_date: due_date || null,
            priority,
            completed: false,
        });

    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath("/tasks");
}

export async function toggleTaskAction(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get current state
    const { data: existing } = await supabase
        .from("tasks")
        .select("completed")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (!existing) throw new Error("Task not found");

    const newCompleted = !existing.completed;

    const { error } = await supabase
        .from("tasks")
        .update({
            completed: newCompleted,
            completed_at: newCompleted ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath("/tasks");
    revalidatePath("/calendar");

    return newCompleted;
}

export async function deleteTaskAction(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath("/tasks");
}

// ============================================
// HABIT ACTIONS
// ============================================

export async function toggleHabitAction(habitId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const today = new Date().toISOString().split("T")[0];

    // Check if log exists
    const { data: existing } = await supabase
        .from("habit_logs")
        .select("*")
        .eq("habit_id", habitId)
        .eq("date", today)
        .single();

    if (existing) {
        // Delete (toggle off)
        await supabase.from("habit_logs").delete().eq("id", existing.id);
        revalidatePath("/habits");
        revalidatePath("/dashboard");
        return false;
    } else {
        // Create (toggle on)
        await supabase.from("habit_logs").insert({
            habit_id: habitId,
            date: today,
            completed: true,
        });
        revalidatePath("/habits");
        revalidatePath("/dashboard");
        return true;
    }
}

// ============================================
// NOTE ACTIONS
// ============================================

export async function createNoteAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const title = formData.get("title") as string | null;
    const content = formData.get("content") as string;

    const { error } = await supabase
        .from("notes")
        .insert({
            user_id: user.id,
            title: title || null,
            content,
        });

    if (error) throw error;

    revalidatePath("/notepad");
}

export async function updateNoteAction(id: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const title = formData.get("title") as string | null;
    const content = formData.get("content") as string;

    const { error } = await supabase
        .from("notes")
        .update({
            title: title || null,
            content,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/notepad");
}

export async function deleteNoteAction(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/notepad");
}
