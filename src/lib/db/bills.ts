import { createClient } from "@/lib/supabase/client";

export interface Bill {
    id: string;
    user_id: string;
    name: string;
    amount: number;
    due_date: number; // Day of month (1-31)
    recurring: "monthly" | "yearly" | "weekly" | null;
    is_paid: boolean;
    last_paid_date: string | null;
    note: string | null;
    created_at: string;
    updated_at: string;
}

export interface BillInput {
    name: string;
    amount: number;
    due_date: number;
    recurring?: "monthly" | "yearly" | "weekly" | null;
    note?: string | null;
}

// Fetch user's bills
export async function getBills(): Promise<Bill[]> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date", { ascending: true });

    if (error) throw error;
    return data || [];
}

// Create a new bill
export async function createBill(input: BillInput): Promise<Bill> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("bills")
        .insert({
            user_id: user.id,
            name: input.name,
            amount: input.amount,
            due_date: input.due_date,
            recurring: input.recurring || "monthly",
            note: input.note || null,
            is_paid: false,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Toggle bill paid status
export async function toggleBillPaid(id: string): Promise<Bill> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get current state
    const { data: existing, error: fetchError } = await supabase
        .from("bills")
        .select("is_paid")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (fetchError) throw fetchError;

    const newPaid = !existing.is_paid;

    const { data, error } = await supabase
        .from("bills")
        .update({
            is_paid: newPaid,
            last_paid_date: newPaid ? new Date().toISOString().split("T")[0] : null,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Delete a bill
export async function deleteBill(id: string): Promise<void> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("bills")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw error;
}

// Get upcoming bills (unpaid)
export async function getUpcomingBills(): Promise<Bill[]> {
    const bills = await getBills();
    return bills.filter(b => !b.is_paid);
}

// Get bills total for the month
export async function getMonthlyBillsTotal(): Promise<number> {
    const bills = await getBills();
    return bills
        .filter(b => b.recurring === "monthly" || b.recurring === null)
        .reduce((sum, b) => sum + Number(b.amount), 0);
}
