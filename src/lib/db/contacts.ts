import { createClient } from "@/lib/supabase/client";

export interface Contact {
    id: string;
    user_id: string;
    name: string;
    phone: string | null;
    email: string | null;
    birthday: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface ContactInput {
    name: string;
    phone?: string | null;
    email?: string | null;
    birthday?: string | null;
    notes?: string | null;
}

// Fetch user's contacts
export async function getContacts(): Promise<Contact[]> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
}

// Create a new contact
export async function createContact(input: ContactInput): Promise<Contact> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("contacts")
        .insert({
            user_id: user.id,
            name: input.name,
            phone: input.phone || null,
            email: input.email || null,
            birthday: input.birthday || null,
            notes: input.notes || null,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Update a contact
export async function updateContact(id: string, input: ContactInput): Promise<Contact> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("contacts")
        .update({
            name: input.name,
            phone: input.phone || null,
            email: input.email || null,
            birthday: input.birthday || null,
            notes: input.notes || null,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Delete a contact
export async function deleteContact(id: string): Promise<void> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw error;
}
