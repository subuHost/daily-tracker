import { createClient } from "@/lib/supabase/client";

export interface Event {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    date: string; // ISO date string or timestamp
    type: "meeting" | "function" | "birthday" | "other";
    location: string | null;
    created_at: string;
}

export interface EventInput {
    title: string;
    description?: string | null;
    date: string;
    type: "meeting" | "function" | "birthday" | "other";
    location?: string | null;
}

// Fetch all events for the user
export async function getEvents(): Promise<Event[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

    if (error) throw error;
    return data || [];
}

// Fetch upcoming events (e.g. for homepage widget)
export async function getUpcomingEvents(limit: number = 3): Promise<Event[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

// Create new event
export async function createEvent(input: EventInput): Promise<Event> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("events")
        .insert({
            user_id: user.id,
            title: input.title,
            description: input.description || null,
            date: input.date,
            type: input.type,
            location: input.location || null,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Delete event
export async function deleteEvent(id: string): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw error;
}

// Update event
export async function updateEvent(id: string, input: Partial<EventInput>): Promise<Event> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("events")
        .update({
            title: input.title,
            description: input.description,
            date: input.date,
            type: input.type,
            location: input.location,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

