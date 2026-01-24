import { createClient } from "@/lib/supabase/client";

export interface Category {
    id: string;
    user_id: string;
    name: string;
    type: "expense" | "income" | "habit" | "task_group" | "gallery_tag";
    color: string;
    icon: string | null;
    created_at: string;
}

// Default expense categories (will be created on first use)
export const DEFAULT_EXPENSE_CATEGORIES = [
    { name: "Food & Dining", color: "#ef4444", icon: "🍔" },
    { name: "Transport", color: "#f97316", icon: "🚗" },
    { name: "Entertainment", color: "#eab308", icon: "🎬" },
    { name: "Shopping", color: "#22c55e", icon: "🛒" },
    { name: "Bills & Utilities", color: "#3b82f6", icon: "📄" },
    { name: "Health", color: "#8b5cf6", icon: "💊" },
    { name: "Education", color: "#ec4899", icon: "📚" },
    { name: "Other", color: "#6b7280", icon: "📦" },
];

// Get user's categories by type
export async function getCategories(type: Category["type"]): Promise<Category[]> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", type)
        .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
}

// Get or create a category by name
export async function getOrCreateCategory(
    name: string,
    type: Category["type"],
    color?: string,
    icon?: string
): Promise<Category> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // First try to find existing
    const { data: existing } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .eq("name", name)
        .eq("type", type)
        .single();

    if (existing) return existing;

    // Create new
    const { data, error } = await supabase
        .from("categories")
        .insert({
            user_id: user.id,
            name,
            type,
            color: color || "#6b7280",
            icon: icon || null,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Initialize default expense categories for a new user
export async function initializeDefaultCategories(): Promise<void> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Check if user already has expense categories
    const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .limit(1);

    if (existing && existing.length > 0) return;

    // Create default categories
    const categories = DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({
        user_id: user.id,
        name: cat.name,
        type: "expense" as const,
        color: cat.color,
        icon: cat.icon,
    }));

    const { error } = await supabase.from("categories").insert(categories);
    if (error) throw error;
}

// Delete a category
export async function deleteCategory(id: string): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw error;
}
