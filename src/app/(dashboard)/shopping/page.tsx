"use client";

import { useState } from "react";
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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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

    const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const wishlist = filteredItems.filter((i) => !i.purchased);
    const purchased = filteredItems.filter((i) => i.purchased);

    const togglePurchased = (id: string) => {
        setItems(items.map((i) =>
            i.id === id ? { ...i, purchased: !i.purchased } : i
        ));
    };

    const totalWishlist = wishlist.reduce((sum, item) => sum + item.price, 0);

    const getPriorityStars = (priority: string) => {
        switch (priority) {
            case "high": return 3;
            case "medium": return 2;
            default: return 1;
        }
    };

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
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/shopping/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                    </Link>
                </Button>
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
                            <Card key={item.id} className="hover:bg-accent/50 transition-colors">
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
                                        <p className="font-semibold shrink-0 text-sm sm:text-base">
                                            {formatCurrency(item.price)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {wishlist.length === 0 && items.length > 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                <p>Your wishlist is empty</p>
                            </div>
                        )}
                    </div>

                    {/* Purchased */}
                    {purchased.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-sm font-medium text-muted-foreground">
                                Purchased ({purchased.length})
                            </h2>
                            {purchased.map((item) => (
                                <Card key={item.id} className="opacity-60">
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
                                            <p className="font-semibold shrink-0 text-muted-foreground text-sm sm:text-base">
                                                {formatCurrency(item.price)}
                                            </p>
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
        </div>
    );
}
