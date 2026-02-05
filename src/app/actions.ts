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

// ============================================
// STUDY ACTIONS
// ============================================

import {
    createProblem,
    logAttempt,
    AttemptOutcome,
    Problem,
    saveSystemDesignCase,
    SystemDesignCase
} from "@/lib/db/study";

export async function createProblemAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const title = formData.get("title") as string;
    const link = formData.get("link") as string | null;
    const link_gfg = formData.get("link_gfg") as string | null;
    const difficulty = formData.get("difficulty") as string;
    const topic = formData.get("topic") as string | null;
    const companies = formData.get("companies") as string | null;
    const comment = formData.get("comment") as string | null;
    const freq = parseInt(formData.get("frequency_score") as string) || 0;

    await createProblem({
        title,
        link,
        link_gfg,
        difficulty: difficulty || "Medium",
        topic_category: topic,
        companies: companies,
        comment: comment,
        frequency_score: freq,
        srs_bucket: 0
    }, supabase);

    revalidatePath("/study");
}

export async function logAttemptAction(
    problemId: string,
    outcome: AttemptOutcome,
    confidence: number,
    timeTaken?: number,
    notes?: string
) {
    const supabase = await createClient(); // Pass to internal functions

    // Log the attempt and update SRS
    // Fetch problem first to get bucket
    const { data: problem } = await supabase.from('problems').select('srs_bucket').eq('id', problemId).single();

    // Log attempt with correct bucket
    await logAttempt(problemId, {
        outcome,
        confidence_rating: confidence,
        time_taken_seconds: timeTaken,
        notes_markdown: notes
    }, problem?.srs_bucket || 0, supabase);

    // --- CROSS MODULE INTEGRATIONS ---
    // (Health check logic omitted for brevity, keeping existing)
    if (timeTaken && timeTaken > 0) {
        const today = new Date().toISOString().split("T")[0];

        // Sum total time for today
        const { data: attempts } = await supabase
            .from('attempts')
            .select('time_taken_seconds')
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
            .gte('timestamp', `${today}T00:00:00`)
            .lte('timestamp', `${today}T23:59:59`);

        const totalSeconds = attempts?.reduce((acc, curr) => acc + (curr.time_taken_seconds || 0), 0) || 0;

        if (totalSeconds > 4 * 3600) { // > 4 hours
            // Trigger Health Alert (Log a note in health metrics if not exists)
            // We'll just append to notes for now as a simple integration
            const { data: health } = await supabase
                .from('health_metrics')
                .select('notes')
                .eq('date', today)
                .maybeSingle();

            const alertMsg = "⚠️ High Cognitive Load Detected (>4h Study)";
            if (!health?.notes?.includes(alertMsg)) {
                await supabase.from('health_metrics').upsert({
                    user_id: (await supabase.auth.getUser()).data.user?.id,
                    date: today,
                    notes: health?.notes ? `${health.notes}\n${alertMsg}` : alertMsg
                });
            }
        }
    }

    revalidatePath("/study");
    revalidatePath("/dashboard"); // For health/streaks
}

export async function saveSystemDesignCaseAction(caseId: string | undefined, data: Partial<SystemDesignCase>) {
    await saveSystemDesignCase({
        ...data,
        id: caseId
    });
    revalidatePath("/study/system-design");
}

export async function toggleProblemCompletionAction(id: string, completed: boolean) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('problems')
        .update({
            is_completed: completed,
            completion_date: completed ? new Date().toISOString() : null
        })
        .eq('id', id);

    if (error) throw error;
    revalidatePath("/study");
}

export async function updateProblemAction(id: string, formData: FormData) {
    const supabase = await createClient();

    const updates: any = {};
    const title = formData.get("title") as string;
    if (title) updates.title = title;

    const link = formData.get("link") as string;
    if (link !== null) updates.link = link;

    const link_gfg = formData.get("link_gfg") as string;
    if (link_gfg !== null) updates.link_gfg = link_gfg;

    const difficulty = formData.get("difficulty") as string;
    if (difficulty) updates.difficulty = difficulty;

    const topic = formData.get("topic") as string;
    if (topic) updates.topic_category = topic;

    const companies = formData.get("companies") as string;
    if (companies !== null) updates.companies = companies;

    const comment = formData.get("comment") as string;
    if (comment !== null) updates.comment = comment;

    const freq = formData.get("frequency_score") as string;
    if (freq) updates.frequency_score = parseInt(freq);

    const { error } = await supabase
        .from('problems')
        .update(updates)
        .eq('id', id);

    if (error) throw error;
    revalidatePath("/study");
}
