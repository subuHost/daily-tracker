import { createClient } from "@/lib/supabase/client";

export interface GalleryItem {
    id: string;
    user_id: string;
    file_url: string;
    file_name: string | null;
    file_type: string | null;
    description: string | null;
    tags: string[] | null;
    upload_date: string;
    created_at: string;
}

export interface GalleryItemInput {
    file_url: string;
    file_name?: string | null;
    file_type?: string | null;
    description?: string | null;
    tags?: string[] | null;
}

// Fetch user's gallery items
export async function getGalleryItems(): Promise<GalleryItem[]> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("gallery_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
}

// Upload file to Supabase storage and create gallery item
export async function uploadGalleryFile(
    file: File,
    description?: string,
    tags?: string[]
): Promise<GalleryItem> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Generate unique file path
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "bin";
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${user.id}/${Date.now()}-${sanitizedName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
        });

    if (uploadError) {
        console.error("Supabase Storage Upload Error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from("gallery")
        .getPublicUrl(uploadData.path);

    console.log("Upload successful. Path:", uploadData.path, "Public URL:", urlData.publicUrl);

    // Create gallery item in database
    const { data, error } = await supabase
        .from("gallery_items")
        .insert({
            user_id: user.id,
            file_url: urlData.publicUrl,
            file_name: file.name,
            file_type: file.type,
            description: description || null,
            tags: tags || null,
            upload_date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Create gallery item with external URL
export async function createGalleryItem(input: GalleryItemInput): Promise<GalleryItem> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("gallery_items")
        .insert({
            user_id: user.id,
            file_url: input.file_url,
            file_name: input.file_name || null,
            file_type: input.file_type || null,
            description: input.description || null,
            tags: input.tags || null,
            upload_date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Delete a gallery item
export async function deleteGalleryItem(id: string, fileUrl: string): Promise<void> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Extract file path from URL and delete from storage
    const urlParts = fileUrl.split("/gallery/");
    if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from("gallery").remove([filePath]);
    }

    // Delete from database
    const { error } = await supabase
        .from("gallery_items")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw error;
}

// Update gallery item
export async function updateGalleryItem(
    id: string,
    input: { description?: string; tags?: string[] }
): Promise<GalleryItem> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("gallery_items")
        .update({
            description: input.description,
            tags: input.tags,
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

    if (error) throw error;
    return data;
}
