import { createClient } from "@/lib/supabase/client";

export interface Debt {
    id: string;
    user_id: string;
    person: string;
    amount: number;
    type: "lend" | "borrow";
    date: string;
    due_date: string | null;
    status: "pending" | "paid" | "partial";
    note: string | null;
    contact_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface DebtInput {
    person: string;
    amount: number;
    type: "lend" | "borrow";
    date?: string;
    due_date?: string | null;
    note?: string | null;
    contact_id?: string | null;
}

// Fetch user's debts
export async function getDebts(): Promise<Debt[]> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("debts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
}

// Create a new debt
export async function createDebt(input: DebtInput): Promise<Debt> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("debts")
        .insert({
            user_id: user.id,
            person: input.person,
            amount: input.amount,
            type: input.type,
            date: input.date || new Date().toISOString().split("T")[0],
            due_date: input.due_date || null,
            note: input.note || null,
            contact_id: input.contact_id || null,
            status: "pending",
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Update debt status
export async function updateDebtStatus(id: string, status: "pending" | "paid" | "partial"): Promise<Debt> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("debts")
        .update({ status })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Update a debt (full edit)
export async function updateDebt(id: string, input: Partial<DebtInput>): Promise<Debt> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const updateData: Record<string, unknown> = {};
    if (input.person !== undefined) updateData.person = input.person;
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.date !== undefined) updateData.date = input.date;
    if (input.due_date !== undefined) updateData.due_date = input.due_date;
    if (input.note !== undefined) updateData.note = input.note;
    if (input.contact_id !== undefined) updateData.contact_id = input.contact_id;

    const { data, error } = await supabase
        .from("debts")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Get debts by contact
export async function getDebtsByContact(contactId: string): Promise<Debt[]> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("debts")
        .select("*")
        .eq("user_id", user.id)
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
}

// Delete a debt
export async function deleteDebt(id: string): Promise<void> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("debts")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw error;
}

// Get debt summary
export async function getDebtSummary(): Promise<{ totalLent: number; totalBorrowed: number }> {
    const debts = await getDebts();
    const pending = debts.filter(d => d.status === "pending");

    const totalLent = pending
        .filter(d => d.type === "lend")
        .reduce((sum, d) => sum + Number(d.amount), 0);

    const totalBorrowed = pending
        .filter(d => d.type === "borrow")
        .reduce((sum, d) => sum + Number(d.amount), 0);

    return { totalLent, totalBorrowed };
}
