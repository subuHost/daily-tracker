import { createClient } from "@/lib/supabase/client";

export interface Transaction {
    id: string;
    user_id: string;
    type: "expense" | "income";
    amount: number;
    description: string;
    category_id: string | null;
    category_name?: string;
    category_color?: string;
    date: string;
    note: string | null;
    created_at: string;
    updated_at: string;
}

export interface TransactionInput {
    type: "expense" | "income";
    amount: number;
    description: string;
    category_id?: string | null;
    date: string;
    note?: string | null;
}

// Fetch user's transactions with optional date filtering
export async function getTransactions(
    limit: number = 50,
    startDate?: string,
    endDate?: string
): Promise<Transaction[]> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    let query = supabase
        .from("transactions")
        .select(`
            *,
            categories (
                name,
                color
            )
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(limit);

    if (startDate) {
        query = query.gte("date", startDate);
    }
    if (endDate) {
        query = query.lte("date", endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((t: any) => ({
        ...t,
        category_name: t.categories?.name || "Uncategorized",
        category_color: t.categories?.color || "#6b7280",
    }));
}

// Create a new transaction
export async function createTransaction(input: TransactionInput): Promise<Transaction> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("transactions")
        .insert({
            user_id: user.id,
            type: input.type,
            amount: input.amount,
            description: input.description,
            category_id: input.category_id || null,
            date: input.date,
            note: input.note || null,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Get summary for a date range
export async function getStats(startDate: string, endDate: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("transactions")
        .select("type, amount")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate);

    if (error) throw error;

    const stats = (data || []).reduce(
        (acc, t) => {
            if (t.type === "income") {
                acc.totalIncome += Number(t.amount);
            } else {
                acc.totalExpenses += Number(t.amount);
            }
            return acc;
        },
        { totalIncome: 0, totalExpenses: 0 }
    );

    return {
        ...stats,
        savings: stats.totalIncome - stats.totalExpenses,
    };
}

// Get monthly summary (Legacy Wrapper)
export async function getMonthlyStats(month: number, year: number) {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().split("T")[0]; // Last day of month
    return getStats(startDate, endDate);
}

// Get spending by category for a date range
export async function getCategoryBreakdownRange(startDate: string, endDate: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("transactions")
        .select(`
            amount,
            categories (
                name,
                color
            )
        `)
        .eq("user_id", user.id)
        .eq("type", "expense")
        .gte("date", startDate)
        .lte("date", endDate);

    if (error) throw error;

    // Group by category
    const categoryMap = new Map<string, { name: string; value: number; color: string }>();

    (data || []).forEach((t: any) => {
        const name = t.categories?.name || "Uncategorized";
        const color = t.categories?.color || "#6b7280";
        const existing = categoryMap.get(name);

        if (existing) {
            existing.value += Number(t.amount);
        } else {
            categoryMap.set(name, { name, value: Number(t.amount), color });
        }
    });

    return Array.from(categoryMap.values());
}

// Get category breakdown (Legacy Wrapper)
export async function getCategoryBreakdown(month: number, year: number) {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];
    return getCategoryBreakdownRange(startDate, endDate);
}

// Delete a transaction
export async function deleteTransaction(id: string): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw error;
}
