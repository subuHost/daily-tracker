import { createClient } from "@/lib/supabase/client";

export interface HealthMetric {
    id: string;
    user_id: string;
    date: string;
    weight: number | null;
    height: number | null;
    sleep_hours: number | null;
    water_intake: number | null;
    mood: string | null;
    notes: string | null;
    created_at: string;
}

export interface FoodLog {
    id: string;
    user_id: string;
    date: string;
    meal_type: string | null;
    food_item: string;
    quantity: string | null;
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fats: number | null;
    created_at: string;
}

// Log a food item
export async function logFood(input: Partial<FoodLog>): Promise<FoodLog> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("food_logs")
        .insert({
            user_id: user.id,
            date: input.date || new Date().toISOString().split("T")[0],
            meal_type: input.meal_type || "snack",
            food_item: input.food_item,
            quantity: input.quantity,
            calories: input.calories || 0,
            protein: input.protein || 0,
            carbs: input.carbs || 0,
            fats: input.fats || 0,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Get food logs for a specific date
export async function getFoodLogs(date: string): Promise<FoodLog[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("food_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", date)
        .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
}

// Log/Update health metrics for the day
export async function logHealthMetrics(input: Partial<HealthMetric> & { date: string }): Promise<HealthMetric> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Check if entry exists for date
    const { data: existing } = await supabase
        .from("health_metrics")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", input.date)
        .single();

    let result;
    if (existing) {
        const { data, error } = await supabase
            .from("health_metrics")
            .update(input)
            .eq("id", existing.id)
            .select()
            .single();
        if (error) throw error;
        result = data;
    } else {
        const { data, error } = await supabase
            .from("health_metrics")
            .insert({ ...input, user_id: user.id })
            .select()
            .single();
        if (error) throw error;
        result = data;
    }
    return result;
}

// Get health metrics for a date
export async function getHealthMetrics(date: string): Promise<HealthMetric | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("health_metrics")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", date)
        .maybeSingle();

    if (error) throw error;
    return data;
}
