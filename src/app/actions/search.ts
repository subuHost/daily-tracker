"use server";

import { createClient } from "@/lib/supabase/server";

export interface SearchResult {
    id: string;
    title: string;
    description?: string;
    type: "task" | "food" | "contact" | "shopping";
    url: string;
    date?: string;
    metadata?: any;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const results: SearchResult[] = [];
    const searchTerm = `%${query}%`;

    // 1. Search Tasks
    const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5);

    if (tasks) {
        tasks.forEach(t => {
            results.push({
                id: t.id,
                title: t.title,
                description: t.description || undefined,
                type: "task",
                url: "/tasks",
                date: t.due_date
            });
        });
    }

    // 2. Search Food Logs
    const { data: food } = await supabase
        .from("food_logs")
        .select("*")
        .eq("user_id", user.id)
        .ilike("food_item", searchTerm)
        .limit(5);

    if (food) {
        food.forEach(f => {
            results.push({
                id: f.id,
                title: f.food_item,
                description: `${f.calories} kcal | ${f.meal_type}`,
                type: "food",
                url: "/health",
                date: f.date
            });
        });
    }

    // 3. Search Contacts
    const { data: contacts } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
        .or(`name.ilike.${searchTerm},notes.ilike.${searchTerm}`)
        .limit(5);

    if (contacts) {
        contacts.forEach(c => {
            results.push({
                id: c.id,
                title: c.name,
                description: c.email || c.phone || undefined,
                type: "contact",
                url: "/contacts"
            });
        });
    }

    // 4. Search Shopping
    const { data: shopping } = await supabase
        .from("shopping_items")
        .select("*")
        .eq("user_id", user.id)
        .or(`name.ilike.${searchTerm},comments.ilike.${searchTerm}`)
        .limit(5);

    if (shopping) {
        shopping.forEach(s => {
            results.push({
                id: s.id,
                title: s.name,
                description: s.comments || undefined,
                type: "shopping",
                url: "/shopping"
            });
        });
    }

    return results;
}
