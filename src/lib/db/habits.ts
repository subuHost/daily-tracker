import { createClient } from "@/lib/supabase/client";

export interface Habit {
    id: string;
    user_id: string;
    name: string;
    icon: string | null;
    color: string;
    target_days: number;
    created_at: string;
}

export interface HabitWithStats extends Habit {
    streak: number;
    completedToday: boolean;
    completedDays: number;
    totalDays: number;
    recentLogs: string[]; // dates of completion
}

export interface HabitLog {
    id: string;
    habit_id: string;
    date: string;
    completed: boolean;
    note: string | null;
    created_at: string;
}

// Fetch user's habits with stats
export async function getHabits(): Promise<HabitWithStats[]> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Fetch habits
    const { data: habits, error: habitsError } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

    if (habitsError) throw habitsError;
    if (!habits || habits.length === 0) return [];

    // Fetch logs for all habits
    const today = new Date().toISOString().split("T")[0];
    const habitIds = habits.map((h) => h.id);

    const { data: logs, error: logsError } = await supabase
        .from("habit_logs")
        .select("*")
        .in("habit_id", habitIds)
        .order("date", { ascending: false });

    if (logsError) throw logsError;

    // Calculate stats for each habit
    return habits.map((habit) => {
        const habitLogs = (logs || []).filter((l) => l.habit_id === habit.id);
        const completedToday = habitLogs.some((l) => l.date === today && l.completed);
        const completedDays = habitLogs.filter((l) => l.completed).length;

        // Calculate streak (consecutive days)
        let streak = 0;
        const sortedLogs = habitLogs
            .filter((l) => l.completed)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (sortedLogs.length > 0) {
            let currentDate = new Date(today);
            for (const log of sortedLogs) {
                const logDate = new Date(log.date);
                const daysDiff = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

                if (daysDiff <= 1) {
                    streak++;
                    currentDate = logDate;
                } else {
                    break;
                }
            }
        }

        // Calculate total days since habit creation
        const createdDate = new Date(habit.created_at);
        const totalDays = Math.max(1, Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));

        return {
            ...habit,
            streak,
            completedToday,
            completedDays,
            totalDays,
            recentLogs: habitLogs.map(l => l.date),
        };
    });
}

// Create a new habit
export async function createHabit(name: string, icon: string = "✨", color: string = "#8b5cf6"): Promise<Habit> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("habits")
        .insert({
            user_id: user.id,
            name,
            icon,
            color,
            target_days: 7,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Toggle habit for today
export async function toggleHabitToday(habitId: string): Promise<boolean> {
    const supabase = createClient();

    const today = new Date().toISOString().split("T")[0];

    // Check if log exists for today
    const { data: existing } = await supabase
        .from("habit_logs")
        .select("*")
        .eq("habit_id", habitId)
        .eq("date", today)
        .single();

    if (existing) {
        // Delete the log (toggle off)
        const { error } = await supabase
            .from("habit_logs")
            .delete()
            .eq("id", existing.id);

        if (error) throw error;
        return false;
    } else {
        // Create new log (toggle on)
        const { error } = await supabase
            .from("habit_logs")
            .insert({
                habit_id: habitId,
                date: today,
                completed: true,
            });

        if (error) throw error;
        return true;
    }
}

// Update a habit
export async function updateHabit(id: string, updates: { name?: string; icon?: string; color?: string; target_days?: number }): Promise<Habit> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("habits")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Delete a habit
export async function deleteHabit(id: string): Promise<void> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("habits")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw error;
}
