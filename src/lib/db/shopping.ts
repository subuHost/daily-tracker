import { createClient } from "@/lib/supabase/client";

export interface ShoppingItem {
    id: string;
    user_id: string;
    name: string;
    price: number | null;
    link: string | null;
    priority: "low" | "medium" | "high";
    comments: string | null;
    purchased: boolean;
    purchased_date: string | null;
    created_at: string;
    updated_at: string;
}

export interface ShoppingItemInput {
    name: string;
    price?: number | null;
    link?: string | null;
    priority?: "low" | "medium" | "high";
    comments?: string | null;
}

// Fetch user's shopping items
export async function getShoppingItems(): Promise<ShoppingItem[]> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("shopping_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
}

// Create a new shopping item
export async function createShoppingItem(input: ShoppingItemInput): Promise<ShoppingItem> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("shopping_items")
        .insert({
            user_id: user.id,
            name: input.name,
            price: input.price || null,
            link: input.link || null,
            priority: input.priority || "medium",
            comments: input.comments || null,
            purchased: false,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Toggle purchased status
export async function toggleShoppingItemPurchased(id: string): Promise<ShoppingItem> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get current state
    const { data: existing, error: fetchError } = await supabase
        .from("shopping_items")
        .select("purchased")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (fetchError) throw fetchError;

    const newPurchased = !existing.purchased;

    const { data, error } = await supabase
        .from("shopping_items")
        .update({
            purchased: newPurchased,
            purchased_date: newPurchased ? new Date().toISOString().split("T")[0] : null,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Delete a shopping item
export async function deleteShoppingItem(id: string): Promise<void> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("shopping_items")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw error;
}

// Update a shopping item
export async function updateShoppingItem(id: string, input: Partial<ShoppingItemInput>): Promise<ShoppingItem> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("shopping_items")
        .update({
            name: input.name,
            price: input.price,
            link: input.link,
            priority: input.priority,
            comments: input.comments,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}
