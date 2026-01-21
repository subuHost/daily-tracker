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

const sampleItems: ShoppingItem[] = [
    { id: "1", name: "Sony WH-1000XM5 Headphones", price: 29990, priority: "high", link: "https://amazon.in", purchased: false },
    { id: "2", name: "Kindle Paperwhite", price: 14999, priority: "medium", link: "https://amazon.in", purchased: false },
    { id: "3", name: "Running Shoes", price: 5999, priority: "high", purchased: false },
    { id: "4", name: "Standing Desk", price: 25000, priority: "low", purchased: false },
    { id: "5", name: "Mechanical Keyboard", price: 8500, priority: "medium", purchased: true },
    { id: "6", name: "Monitor Light Bar", price: 3500, priority: "low", purchased: false },
];

export default function ShoppingPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [items, setItems] = useState<ShoppingItem[]>(sampleItems);

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Shopping List</h1>
                    <p className="text-muted-foreground">
                        {wishlist.length} items • {formatCurrency(totalWishlist)} total
                    </p>
                </div>
                <Button asChild>
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

            {/* Wishlist */}
            <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground">
                    Wishlist ({wishlist.length})
                </h2>
                {wishlist.map((item) => (
                    <Card key={item.id} className="hover:bg-accent/50 transition-colors">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0"
                                        onClick={() => togglePurchased(item.id)}
                                    >
                                        <ShoppingCart className="h-5 w-5" />
                                    </Button>
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{item.name}</p>
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
                                                    Link
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <p className="font-semibold shrink-0">
                                    {formatCurrency(item.price)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {wishlist.length === 0 && (
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
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="shrink-0 text-green-500"
                                            onClick={() => togglePurchased(item.id)}
                                        >
                                            <Check className="h-5 w-5" />
                                        </Button>
                                        <div className="min-w-0">
                                            <p className="font-medium truncate line-through">
                                                {item.name}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-semibold shrink-0 text-muted-foreground">
                                        {formatCurrency(item.price)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
