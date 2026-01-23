import { createClient } from "@/lib/supabase/client";

export interface Budget {
    id: string;
    user_id: string;
    amount: number;
    month: number;
    year: number;
    created_at: string;
    updated_at: string;
}

// Get current month's budget
export async function getCurrentBudget(): Promise<Budget | null> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", month)
        .eq("year", year)
        .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
        throw error;
    }

    return data;
}

// Create or update budget for a month
export async function setBudget(amount: number, month?: number, year?: number): Promise<Budget> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const { data, error } = await supabase
        .from("budgets")
        .upsert(
            {
                user_id: user.id,
                amount,
                month: targetMonth,
                year: targetYear,
            },
            {
                onConflict: "user_id,month,year",
            }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Calculate total spent for a month
export async function getMonthlySpent(month?: number, year?: number): Promise<number> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`;
    const endDate = new Date(targetYear, targetMonth, 0).toISOString().split("T")[0];

    const { data, error } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .gte("date", startDate)
        .lte("date", endDate);

    if (error) throw error;

    return (data || []).reduce((sum, t) => sum + Number(t.amount), 0);
}
