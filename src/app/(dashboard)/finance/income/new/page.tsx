"use client";

import { useState, useEffect } from "react";
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
import { createTransaction, getCategories } from "@/lib/db";

const incomeSchema = z.object({
    amount: z.string().min(1, "Amount is required"),
    description: z.string().min(1, "Description is required"),
    category: z.string().min(1, "Category is required"),
    date: z.string().min(1, "Date is required"),
});

type IncomeForm = z.infer<typeof incomeSchema>;

interface Category {
    id: string;
    name: string;
}

export default function NewIncomePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<IncomeForm>({
        resolver: zodResolver(incomeSchema),
        defaultValues: {
            date: new Date().toISOString().split("T")[0],
        },
    });

    useEffect(() => {
        async function loadCategories() {
            try {
                const cats = await getCategories("income");
                setCategories(cats);
            } catch (error) {
                console.error("Failed to load categories:", error);
            }
        }
        loadCategories();
    }, []);

    const onSubmit = async (data: IncomeForm) => {
        setIsLoading(true);
        try {
            await createTransaction({
                type: "income",
                amount: parseFloat(data.amount),
                description: data.description,
                category_id: data.category,
                date: data.date,
            });
            toast.success("Income added successfully!");
            router.push("/finance/income");
        } catch (error) {
            console.error("Failed to add income:", error);
            toast.error("Failed to add income. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/finance/income">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Add Income</h1>
                    <p className="text-muted-foreground">Record new income</p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₹)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0"
                                {...register("amount")}
                            />
                            {errors.amount && (
                                <p className="text-sm text-destructive">{errors.amount.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                placeholder="e.g., Salary, Freelance payment"
                                {...register("description")}
                            />
                            {errors.description && (
                                <p className="text-sm text-destructive">{errors.description.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select onValueChange={(value) => setValue("category", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                    {categories.length === 0 && (
                                        <SelectItem value="uncategorized">Uncategorized</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            {errors.category && (
                                <p className="text-sm text-destructive">{errors.category.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" type="date" {...register("date")} />
                            {errors.date && (
                                <p className="text-sm text-destructive">{errors.date.message}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Income
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
