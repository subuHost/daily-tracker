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

export interface MonthlyBudget {
    month: string;
    budget: number;
}

// Get budgets for the last N months
export async function getMonthlyBudgets(months: number = 6): Promise<MonthlyBudget[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    // We need to query by month/year since that's how the table is structured
    const { data, error } = await supabase
        .from("budgets")
        .select("amount, month, year")
        .eq("user_id", user.id)
        .order("year", { ascending: true })
        .order("month", { ascending: true });

    if (error) throw error;

    const result: MonthlyBudget[] = [];
    for (let i = 0; i < months; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        const monthLabel = d.toLocaleString("default", { month: "short", year: "2-digit" });

        const budgetEntry = (data || []).find((b: any) => b.month === m && b.year === y);
        result.push({
            month: monthLabel,
            budget: budgetEntry ? Number(budgetEntry.amount) : 0
        });
    }

    return result;
}
