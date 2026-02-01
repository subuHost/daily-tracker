"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    ShoppingCart,
    Check,
    ExternalLink,
    Star,
    ShoppingBag,
    Loader2,
    MoreVertical,
    Pencil,
    Trash2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
    getShoppingItems,
    toggleShoppingItemPurchased,
    deleteShoppingItem,
    updateShoppingItem
} from "@/lib/db/shopping";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

interface ShoppingItem {
    id: string;
    name: string;
    price: number;
    priority: "low" | "medium" | "high";
    link?: string;
    purchased: boolean;
    comments?: string;
}

export default function ShoppingPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Edit State
    const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
    const [editForm, setEditForm] = useState({
        name: "",
        price: "",
        link: "",
        priority: "medium" as "low" | "medium" | "high",
        comments: ""
    });

    const loadItems = async () => {
        try {
            const dbItems = await getShoppingItems();
            const formattedItems = dbItems.map((i) => ({
                id: i.id,
                name: i.name,
                price: Number(i.price) || 0,
                priority: i.priority,
                link: i.link || undefined,
                purchased: i.purchased,
                comments: i.comments || undefined,
            }));
            setItems(formattedItems);
        } catch (error) {
            console.error("Failed to load items:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch items on mount
    useEffect(() => {
        loadItems();

        // Realtime Subscription
        const supabase = createClient();
        const channel = supabase
            .channel('shopping_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'shopping_items'
            }, () => {
                loadItems();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const wishlist = filteredItems.filter((i) => !i.purchased);
    const purchased = filteredItems.filter((i) => i.purchased);

    const togglePurchased = async (id: string) => {
        try {
            await toggleShoppingItemPurchased(id);
            setItems(items.map((i) =>
                i.id === id ? { ...i, purchased: !i.purchased } : i
            ));
            toast.success("Item updated!");
        } catch (error) {
            console.error("Failed to update item:", error);
            toast.error("Failed to update item");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            await deleteShoppingItem(id);
            setItems(items.filter(i => i.id !== id));
            toast.success("Item deleted");
        } catch (error) {
            toast.error("Failed to delete item");
        }
    };

    const handleEdit = (item: ShoppingItem) => {
        setEditingItem(item);
        setEditForm({
            name: item.name,
            price: item.price.toString(),
            link: item.link || "",
            priority: item.priority,
            comments: item.comments || ""
        });
    };

    const saveEdit = async () => {
        if (!editingItem) return;
        try {
            await updateShoppingItem(editingItem.id, {
                name: editForm.name,
                price: parseFloat(editForm.price) || 0,
                link: editForm.link,
                priority: editForm.priority,
                comments: editForm.comments
            });
            toast.success("Item updated");
            setEditingItem(null);
            loadItems();
        } catch (error) {
            toast.error("Failed to update item");
        }
    };

    const totalWishlist = wishlist.reduce((sum, item) => sum + item.price, 0);

    const getPriorityStars = (priority: string) => {
        switch (priority) {
            case "high": return 3;
            case "medium": return 2;
            default: return 1;
        }
    };

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
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Shopping List</h1>
                    <p className="text-muted-foreground text-sm">
                        {items.length > 0
                            ? `${wishlist.length} items • ${formatCurrency(totalWishlist)} total`
                            : "Track what you want to buy"}
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full animate-pulse">
                        ● Realtime Active
                    </div>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/shopping/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {items.length > 0 ? (
                <>
                    {/* Wishlist */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-medium text-muted-foreground">
                            Wishlist ({wishlist.length})
                        </h2>
                        {wishlist.map((item) => (
                            <Card key={item.id} className="hover:bg-accent/50 transition-colors group">
                                <CardContent className="p-3 sm:p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                                                onClick={() => togglePurchased(item.id)}
                                            >
                                                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                                            </Button>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm sm:text-base truncate">{item.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <div className="flex">
                                                        {[...Array(getPriorityStars(item.priority))].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className="h-3 w-3 fill-amber-500 text-amber-500"
                                                            />
                                                        ))}
                                                    </div>
                                                    {item.link && (
                                                        <a
                                                            href={item.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-primary flex items-center gap-1"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                            <span className="hidden sm:inline">Link</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold shrink-0 text-sm sm:text-base">
                                                {formatCurrency(item.price)}
                                            </p>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(item)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Purchased */}
                    {purchased.length > 0 && (
                        <div className="space-y-3 mt-8">
                            <h2 className="text-sm font-medium text-muted-foreground">
                                Purchased ({purchased.length})
                            </h2>
                            {purchased.map((item) => (
                                <Card key={item.id} className="opacity-60 group">
                                    <CardContent className="p-3 sm:p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="shrink-0 text-green-500 h-8 w-8 sm:h-10 sm:w-10"
                                                    onClick={() => togglePurchased(item.id)}
                                                >
                                                    <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                                                </Button>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm sm:text-base truncate line-through">
                                                        {item.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold shrink-0 text-muted-foreground text-sm sm:text-base">
                                                    {formatCurrency(item.price)}
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No items in your wishlist</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                        Keep track of things you want to buy and compare prices before purchasing.
                    </p>
                    <Button asChild>
                        <Link href="/shopping/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Your First Item
                        </Link>
                    </Button>
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Item</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Item Name</Label>
                            <Input
                                value={editForm.name}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Price (₹)</Label>
                                <Input
                                    type="number"
                                    value={editForm.price}
                                    onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <select
                                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={editForm.priority}
                                    onChange={e => setEditForm({ ...editForm, priority: e.target.value as any })}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Link</Label>
                            <Input
                                value={editForm.link}
                                onChange={e => setEditForm({ ...editForm, link: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Comments</Label>
                            <Input
                                value={editForm.comments}
                                onChange={e => setEditForm({ ...editForm, comments: e.target.value })}
                            />
                        </div>
                        <Button onClick={saveEdit} className="w-full">Save Changes</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

