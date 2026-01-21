"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    Image as ImageIcon,
    Grid,
    List,
    Upload,
    FileText,
    X,
} from "lucide-react";

interface GalleryItem {
    id: string;
    url: string;
    description: string;
    tags: string[];
    uploadDate: string;
    type: "image" | "document";
}

const sampleItems: GalleryItem[] = [
    { id: "1", url: "/placeholder-1.jpg", description: "Passport scan", tags: ["documents", "important"], uploadDate: "2026-01-15", type: "document" },
    { id: "2", url: "/placeholder-2.jpg", description: "Receipt - Electronics", tags: ["receipts", "shopping"], uploadDate: "2026-01-14", type: "image" },
    { id: "3", url: "/placeholder-3.jpg", description: "Insurance policy", tags: ["documents", "insurance"], uploadDate: "2026-01-10", type: "document" },
    { id: "4", url: "/placeholder-4.jpg", description: "Home loan EMI receipt", tags: ["receipts", "bills"], uploadDate: "2026-01-08", type: "document" },
    { id: "5", url: "/placeholder-5.jpg", description: "Vacation photo", tags: ["personal", "travel"], uploadDate: "2026-01-05", type: "image" },
    { id: "6", url: "/placeholder-6.jpg", description: "Recipe - Biryani", tags: ["recipes"], uploadDate: "2026-01-02", type: "image" },
];

export default function GalleryPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [items] = useState<GalleryItem[]>(sampleItems);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    // Get unique tags
    const allTags = [...new Set(items.flatMap((item) => item.tags))];

    const filteredItems = items.filter((item) => {
        const matchesSearch =
            item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesTag = !selectedTag || item.tags.includes(selectedTag);
        return matchesSearch && matchesTag;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Gallery</h1>
                    <p className="text-muted-foreground">{items.length} files</p>
                </div>
                <Button asChild>
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
                >
                    <Grid className="h-4 w-4" />
                </Button>
                <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                >
                    <List className="h-4 w-4" />
                </Button>
            </div>

            {/* Tags */}
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

            {/* Gallery Grid */}
            {viewMode === "grid" ? (
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {filteredItems.map((item) => (
                        <Card key={item.id} className="overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary">
                            <div className="aspect-square bg-muted flex items-center justify-center relative">
                                {item.type === "image" ? (
                                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                ) : (
                                    <FileText className="h-12 w-12 text-muted-foreground" />
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <p className="text-white text-sm text-center px-2">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                            <CardContent className="p-2">
                                <p className="text-sm font-medium truncate">{item.description}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {item.tags.slice(0, 2).map((tag) => (
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
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredItems.map((item) => (
                        <Card key={item.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                        {item.type === "image" ? (
                                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                        ) : (
                                            <FileText className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium">{item.description}</p>
                                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                            <span>{item.uploadDate}</span>
                                            <span>•</span>
                                            <span>{item.tags.join(", ")}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {filteredItems.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No files found</p>
                </div>
            )}
        </div>
    );
}
