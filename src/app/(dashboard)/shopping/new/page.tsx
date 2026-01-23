"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createShoppingItem } from "@/lib/db";

const shoppingSchema = z.object({
    name: z.string().min(1, "Item name is required"),
    price: z.string().optional(),
    link: z.string().optional(),
    priority: z.string().min(1, "Priority is required"),
    comments: z.string().optional(),
});

type ShoppingForm = z.infer<typeof shoppingSchema>;

export default function NewShoppingItemPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<ShoppingForm>({
        resolver: zodResolver(shoppingSchema),
        defaultValues: {
            priority: "medium",
        },
    });

    const onSubmit = async (data: ShoppingForm) => {
        setIsLoading(true);
        try {
            await createShoppingItem({
                name: data.name,
                price: data.price ? parseFloat(data.price) : null,
                link: data.link || null,
                priority: data.priority as "low" | "medium" | "high",
                comments: data.comments || null,
            });
            toast.success("Item added to wishlist!");
            router.push("/shopping");
        } catch (error) {
            console.error("Failed to add item:", error);
            toast.error("Failed to add item. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/shopping">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Add Item</h1>
                    <p className="text-muted-foreground">Add to your wishlist</p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Item Name</Label>
                            <Input
                                id="name"
                                placeholder="What do you want to buy?"
                                {...register("name")}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price">Price (₹) - optional</Label>
                            <Input
                                id="price"
                                type="number"
                                placeholder="0"
                                {...register("price")}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="link">Link (optional)</Label>
                            <Input
                                id="link"
                                type="url"
                                placeholder="https://..."
                                {...register("link")}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                defaultValue="medium"
                                onValueChange={(value) => setValue("priority", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">
                                        <span className="flex items-center gap-2">⭐ Low</span>
                                    </SelectItem>
                                    <SelectItem value="medium">
                                        <span className="flex items-center gap-2">⭐⭐ Medium</span>
                                    </SelectItem>
                                    <SelectItem value="high">
                                        <span className="flex items-center gap-2">⭐⭐⭐ High</span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.priority && (
                                <p className="text-sm text-destructive">{errors.priority.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="comments">Comments (optional)</Label>
                            <Input
                                id="comments"
                                placeholder="Any notes about this item..."
                                {...register("comments")}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add to Wishlist
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
