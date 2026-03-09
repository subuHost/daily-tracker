import { createClient } from "@/lib/supabase/client";

export interface WatchlistItem {
    id: string;
    user_id: string;
    symbol: string;
    name: string | null;
    exchange: string;
    type: "stock" | "crypto" | "mutual_fund" | "etf";
    notes: string | null;
    alert_price_above: number | null;
    alert_price_below: number | null;
    created_at: string;
    updated_at: string;
}

export interface WatchlistInput {
    symbol: string;
    name?: string | null;
    exchange?: string;
    type?: "stock" | "crypto" | "mutual_fund" | "etf";
    notes?: string | null;
    alert_price_above?: number | null;
    alert_price_below?: number | null;
}

/**
 * Get user's watchlist items.
 */
export async function getWatchlist(): Promise<WatchlistItem[]> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Add a symbol to the watchlist.
 */
export async function addToWatchlist(input: WatchlistInput): Promise<WatchlistItem> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("watchlist")
        .insert({
            user_id: user.id,
            symbol: input.symbol.toUpperCase(),
            name: input.name || null,
            exchange: input.exchange || "NSE",
            type: input.type || "stock",
            notes: input.notes || null,
            alert_price_above: input.alert_price_above || null,
            alert_price_below: input.alert_price_below || null,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Remove a symbol from the watchlist.
 */
export async function removeFromWatchlist(id: string): Promise<void> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw error;
}

/**
 * Update a watchlist item (notes, alerts).
 */
export async function updateWatchlistItem(
    id: string,
    updates: Partial<WatchlistInput>
): Promise<WatchlistItem> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.exchange !== undefined) updateData.exchange = updates.exchange;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.alert_price_above !== undefined) updateData.alert_price_above = updates.alert_price_above;
    if (updates.alert_price_below !== undefined) updateData.alert_price_below = updates.alert_price_below;

    const { data, error } = await supabase
        .from("watchlist")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Check if a symbol is in the user's watchlist.
 */
export async function isInWatchlist(symbol: string): Promise<boolean> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
        .from("watchlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("symbol", symbol.toUpperCase())
        .single();

    return !!data;
}
