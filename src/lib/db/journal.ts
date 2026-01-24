import { createClient } from "@/lib/supabase/client";

export interface DailyEntry {
    id: string;
    user_id: string;
    date: string;
    notes: string | null;
    studied: string | null;
    gym_done: boolean;
    gym_notes: string | null;
    mood: number | null;
    images: string[] | null;
    voice_notes: string[] | null;
    created_at: string;
    updated_at: string;
}

export interface DailyEntryInput {
    date: string;
    notes?: string | null;
    studied?: string | null;
    gym_done?: boolean;
    gym_notes?: string | null;
    mood?: number | null;
    images?: string[] | null;
    voice_notes?: string[] | null;
}

// Fetch entry for a specific date
export async function getDailyEntry(date: string): Promise<DailyEntry | null> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("daily_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", date)
        .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
        throw error;
    }

    return data;
}

// Create or update daily entry
export async function saveDailyEntry(input: DailyEntryInput): Promise<DailyEntry> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("daily_entries")
        .upsert(
            {
                user_id: user.id,
                date: input.date,
                notes: input.notes || null,
                studied: input.studied || null,
                gym_done: input.gym_done || false,
                gym_notes: input.gym_notes || null,
                mood: input.mood || null,
                images: input.images || null,
                voice_notes: input.voice_notes || null,
            },
            {
                onConflict: "user_id,date",
            }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Get recent entries
export async function getRecentEntries(limit: number = 7): Promise<DailyEntry[]> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("daily_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

// Get gym days count for current month
export async function getGymDaysThisMonth(): Promise<number> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${lastDay}`;

    const { data, error } = await supabase
        .from("daily_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("gym_done", true)
        .gte("date", startDate)
        .lte("date", endDate);

    if (error) throw error;
    if (error) throw error;
    return (data || []).length;
}

// Get average mood stats
export async function getMoodStats(month?: number, year?: number, startDate?: string, endDate?: string): Promise<{ average: number; breakdown: Record<number, number> }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { average: 0, breakdown: {} };

    let query = supabase
        .from("daily_entries")
        .select("mood, date")
        .eq("user_id", user.id)
        .not("mood", "is", null);

    if (startDate && endDate) {
        query = query.gte("date", startDate).lte("date", endDate);
    } else if (month && year) {
        const sDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const eDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
        query = query.gte("date", sDate).lte("date", eDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data || data.length === 0) return { average: 0, breakdown: {} };

    const total = data.reduce((acc, curr) => acc + (curr.mood || 0), 0);
    const average = total / data.length;

    const breakdown: Record<number, number> = {};
    data.forEach(entry => {
        const mood = entry.mood || 0;
        breakdown[mood] = (breakdown[mood] || 0) + 1;
    });

    return { average, breakdown };
}

// Get all journal entries (for history list)
export async function getAllEntries(): Promise<DailyEntry[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("daily_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

    if (error) throw error;
    return data || [];
}
