import { createClient } from "@/lib/supabase/client";
import { subDays, format, startOfDay, eachDayOfInterval } from "date-fns";

export interface DailyCorrelationPoint {
    date: string;
    mood: number | null; // 1–5
    sleep: number | null; // hours
    habitCompletionPct: number | null; // 0–100
}

export async function getCorrelationData(days: number = 30): Promise<DailyCorrelationPoint[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");
    const endDate = format(new Date(), "yyyy-MM-dd");

    // 1. Fetch Mood Data
    const { data: moodData, error: moodError } = await supabase
        .from("daily_entries")
        .select("date, mood")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .order("date", { ascending: true });

    if (moodError) throw moodError;

    // 2. Fetch Sleep Data
    const { data: sleepData, error: sleepError } = await supabase
        .from("health_metrics")
        .select("date, sleep_hours")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .order("date", { ascending: true });

    if (sleepError) throw sleepError;

    // 3. Fetch Habit Data
    const { data: habits, error: habitsError } = await supabase
        .from("habits")
        .select("id, target_days")
        .eq("user_id", user.id);

    if (habitsError) throw habitsError;

    const { data: habitLogs, error: logsError } = await supabase
        .from("habit_logs")
        .select("date, habit_id, completed")
        .gte("date", startDate)
        .lte("date", endDate)
        .eq("completed", true);

    if (logsError) throw logsError;

    // Process Habits into daily completion percentages
    const habitsByDayOfWeek: Record<number, string[]> = {
        0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    };
    habits?.forEach(habit => {
        habit.target_days.forEach((day: number) => habitsByDayOfWeek[day].push(habit.id));
    });

    const completedByDate: Record<string, Set<string>> = {};
    habitLogs?.forEach(log => {
        if (!completedByDate[log.date]) completedByDate[log.date] = new Set();
        completedByDate[log.date].add(log.habit_id);
    });

    const habitCompletionMap: Record<string, number> = {};
    const dateRange = eachDayOfInterval({
        start: startOfDay(subDays(new Date(), days)),
        end: startOfDay(new Date())
    });

    dateRange.forEach(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayOfWeek = date.getDay();

        const targetedHabitIds = habitsByDayOfWeek[dayOfWeek];
        const totalTargeted = targetedHabitIds.length;

        if (totalTargeted === 0) {
            habitCompletionMap[dateStr] = 0;
            return;
        }

        const completedSet = completedByDate[dateStr] || new Set();
        const completedCount = targetedHabitIds.filter(id => completedSet.has(id)).length;

        habitCompletionMap[dateStr] = Math.round((completedCount / totalTargeted) * 100);
    });

    // Merge all data
    const moodMap = Object.fromEntries(moodData?.map(d => [d.date, d.mood]) || []);
    const sleepMap = Object.fromEntries(sleepData?.map(d => [d.date, d.sleep_hours]) || []);

    return dateRange.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        return {
            date: dateStr,
            mood: moodMap[dateStr] ?? null,
            sleep: sleepMap[dateStr] ?? null,
            habitCompletionPct: habitCompletionMap[dateStr] || 0
        };
    });
}
