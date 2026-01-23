"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    Image as ImageIcon,
    Grid,
    List,
    Upload,
    FileText,
    X,
    Loader2,
} from "lucide-react";
import { getGalleryItems, type GalleryItem } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { deleteGalleryItem, updateGalleryItem } from "@/lib/db";
import { Trash2, Edit2, Save as SaveIcon, Tag } from "lucide-react";

export default function GalleryPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    // Action State
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ description: "", tags: "" });
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        if (selectedItem) {
            setEditForm({
                description: selectedItem.description || "",
                tags: selectedItem.tags ? selectedItem.tags.join(", ") : "",
            });
            setIsEditing(false);
        }
    }, [selectedItem]);

    const handleDelete = async () => {
        if (!selectedItem) return;
        if (!confirm("Are you sure you want to delete this item?")) return;

        setIsActionLoading(true);
        try {
            await deleteGalleryItem(selectedItem.id, selectedItem.file_url);
            setItems((prev) => prev.filter((i) => i.id !== selectedItem.id));
            setSelectedItem(null);
            toast.success("Item deleted");
        } catch (error: any) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete item");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedItem) return;

        setIsActionLoading(true);
        try {
            const tags = editForm.tags
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t.length > 0);

            const updated = await updateGalleryItem(selectedItem.id, {
                description: editForm.description,
                tags: tags,
            });

            setItems((prev) =>
                prev.map((i) => (i.id === updated.id ? updated : i))
            );
            setSelectedItem(updated);
            setIsEditing(false);
            toast.success("Item updated");
        } catch (error: any) {
            console.error("Update failed:", error);
            toast.error("Failed to update item");
        } finally {
            setIsActionLoading(false);
        }
    };

    useEffect(() => {
        async function loadItems() {
            try {
                const data = await getGalleryItems();
                setItems(data);
            } catch (error) {
                console.error("Failed to load gallery:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadItems();
    }, []);

    // Get unique tags
    const allTags = Array.from(new Set(items.flatMap((item) => item.tags || [])));

    const filteredItems = items.filter((item) => {
        const matchesSearch =
            (item.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.tags || []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesTag = !selectedTag || (item.tags || []).includes(selectedTag);
        return matchesSearch && matchesTag;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Gallery</h1>
                    <p className="text-muted-foreground text-sm">{items.length} files</p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/gallery/upload">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                    </Link>
                </Button>
            </div>

            {/* Search & View Toggle */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className="shrink-0"
                >
                    <Grid className="h-4 w-4" />
                </Button>
                <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className="shrink-0"
                >
                    <List className="h-4 w-4" />
                </Button>
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedTag && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTag(null)}
                            className="text-destructive"
                        >
                            <X className="h-3 w-3 mr-1" />
                            Clear filter
                        </Button>
                    )}
                    {allTags.map((tag) => (
                        <Button
                            key={tag}
                            variant={selectedTag === tag ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        >
                            {tag}
                        </Button>
                    ))}
                </div>
            )}

            {/* Gallery Grid */}
            {filteredItems.length > 0 ? (
                viewMode === "grid" ? (
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                        {filteredItems.map((item) => {
                            const isImage = (item.file_type?.startsWith("image") ||
                                item.tags?.includes("image") ||
                                /\.(jpg|jpeg|png|gif|webp)$/i.test(item.file_url));

                            return (
                                <Card
                                    key={item.id}
                                    className="overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary"
                                    onClick={() => setSelectedItem(item)}
                                >
                                    <div className="aspect-square bg-muted flex items-center justify-center relative">
                                        {isImage ? (
                                            <div className="relative w-full h-full">
                                                <Image
                                                    src={item.file_url}
                                                    alt={item.description || "Gallery image"}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            </div>
                                        ) : (
                                            <FileText className="h-12 w-12 text-muted-foreground" />
                                        )}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <p className="text-white text-sm text-center px-2">
                                                {item.description || "No description"}
                                            </p>
                                        </div>
                                    </div>
                                    <CardContent className="p-2">
                                        <p className="text-sm font-medium truncate">{item.description || "Untitled"}</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {item.tags?.slice(0, 2).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredItems.map((item) => (
                            <Card key={item.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
                                            {(item.file_type && item.file_type.startsWith("image")) ? (
                                                <Image
                                                    src={item.file_url}
                                                    alt={item.description || "Gallery image"}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <FileText className="h-6 w-6 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{item.description || "Untitled"}</p>
                                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                                <span>{formatDate(item.upload_date)}</span>
                                                {item.tags && item.tags.length > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="truncate">{item.tags.join(", ")}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No files uploaded yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Upload your images to keep them organized.
                    </p>
                    <Button asChild>
                        <Link href="/gallery/upload">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Your First File
                        </Link>
                    </Button>
                </div>
            )}


            {/* View/Edit Dialog */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit Item" : "View Item"}</DialogTitle>
                    </DialogHeader>

                    {selectedItem && (
                        <div className="space-y-6">
                            <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                                {selectedItem.file_type?.startsWith("image") || selectedItem.tags?.includes("image") ? (
                                    <Image
                                        src={selectedItem.file_url}
                                        alt={selectedItem.description || "Gallery Item"}
                                        fill
                                        className="object-contain"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <FileText className="h-16 w-16" />
                                        <a href={selectedItem.file_url} target="_blank" rel="noreferrer" className="hover:underline">
                                            Download File
                                        </a>
                                    </div>
                                )}
                            </div>

                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={editForm.description}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Add a description..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tags (comma separated)</Label>
                                        <Input
                                            value={editForm.tags}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                                            placeholder="e.g. receipt, work, travel"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold mb-1">Description</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedItem.description || "No description provided."}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                                            <Tag className="h-4 w-4" /> Tags
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedItem.tags && selectedItem.tags.length > 0 ? (
                                                selectedItem.tags.map(tag => (
                                                    <span key={tag} className="px-2 py-1 bg-secondary rounded-full text-xs font-medium">
                                                        {tag}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-muted-foreground italic">No tags</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground pt-4 border-t">
                                        Uploaded on {formatDate(selectedItem.upload_date)}
                                    </div>
                                </div>
                            )}

                            <DialogFooter className="gap-2 sm:gap-0">
                                {isEditing ? (
                                    <>
                                        <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isActionLoading}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleUpdate} disabled={isActionLoading}>
                                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="destructive" onClick={handleDelete} disabled={isActionLoading}>
                                            {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                            Delete
                                        </Button>
                                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                                            <Edit2 className="mr-2 h-4 w-4" />
                                            Edit Details
                                        </Button>
                                    </>
                                )}
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );
}
