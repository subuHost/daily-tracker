import { createClient } from "@/lib/supabase/client";

export interface Investment {
    id: string;
    user_id: string;
    symbol: string;
    name: string | null;
    buy_price: number;
    quantity: number;
    buy_date: string;
    current_price: number | null;
    sell_price: number | null;
    sell_date: string | null;
    type: "stock" | "crypto" | "mutual_fund" | "other";
    note: string | null;
    created_at: string;
    updated_at: string;
}

export interface InvestmentInput {
    symbol: string;
    name?: string | null;
    buy_price: number;
    quantity: number;
    buy_date?: string;
    type?: "stock" | "crypto" | "mutual_fund" | "other";
    note?: string | null;
}

// Fetch user's investments
export async function getInvestments(): Promise<Investment[]> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("investments")
        .select("*")
        .eq("user_id", user.id)
        .is("sell_date", null) // Only active investments
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
}

// Create a new investment
export async function createInvestment(input: InvestmentInput): Promise<Investment> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("investments")
        .insert({
            user_id: user.id,
            symbol: input.symbol.toUpperCase(),
            name: input.name || null,
            buy_price: input.buy_price,
            quantity: input.quantity,
            buy_date: input.buy_date || new Date().toISOString().split("T")[0],
            type: input.type || "stock",
            note: input.note || null,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Update investment current price
export async function updateInvestmentPrice(id: string, currentPrice: number): Promise<Investment> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("investments")
        .update({ current_price: currentPrice })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Sell investment
export async function sellInvestment(id: string, sellPrice: number): Promise<Investment> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("investments")
        .update({
            sell_price: sellPrice,
            sell_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Delete an investment
export async function deleteInvestment(id: string): Promise<void> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("investments")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw error;
}

// Get investment summary
export async function getInvestmentSummary(): Promise<{
    totalInvested: number;
    currentValue: number;
    totalGain: number;
    gainPercent: number;
}> {
    const investments = await getInvestments();

    let totalInvested = 0;
    let currentValue = 0;

    for (const inv of investments) {
        const invested = Number(inv.buy_price) * Number(inv.quantity);
        totalInvested += invested;

        const current = (inv.current_price || inv.buy_price) * Number(inv.quantity);
        currentValue += current;
    }

    const totalGain = currentValue - totalInvested;
    const gainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    return { totalInvested, currentValue, totalGain, gainPercent };
}
