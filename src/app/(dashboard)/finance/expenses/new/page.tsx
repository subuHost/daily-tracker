"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    createTransaction,
    getCategories,
    initializeDefaultCategories,
    type Category,
} from "@/lib/db";
import { suggestCategory } from "@/app/actions/ai";

const expenseSchema = z.object({
    description: z.string().min(1, "Description is required"),
    amount: z.string().min(1, "Amount is required"),
    category: z.string().min(1, "Category is required"),
    date: z.string().min(1, "Date is required"),
    note: z.string().optional(),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

export default function NewExpensePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [hasAiSuggestion, setHasAiSuggestion] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ExpenseForm>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            date: format(new Date(), "yyyy-MM-dd"),
        },
    });

    const description = watch("description");
    const currentCategory = watch("category");

    // Load categories on mount
    useEffect(() => {
        async function loadCategories() {
            try {
                // Initialize default categories if needed
                await initializeDefaultCategories();
                // Fetch categories
                const cats = await getCategories("expense");
                setCategories(cats);
            } catch (error) {
                console.error("Failed to load categories:", error);
                toast.error("Failed to load categories");
            } finally {
                setLoadingCategories(false);
            }
        }
        loadCategories();
    }, []);

    const onSubmit = async (data: ExpenseForm) => {
        setIsLoading(true);
        try {
            await createTransaction({
                type: "expense",
                amount: parseFloat(data.amount),
                description: data.description,
                category_id: data.category,
                date: data.date,
                note: data.note || null,
            });
            toast.success("Expense added successfully!");
            router.push("/finance/expenses");
        } catch (error) {
            console.error("Failed to add expense:", error);
            toast.error("Failed to add expense. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDescriptionBlur = async () => {
        if (!description || description.length < 3 || currentCategory) return;

        setIsSuggesting(true);
        try {
            const suggestedId = await suggestCategory(description);
            if (suggestedId) {
                setValue("category", suggestedId);
                setHasAiSuggestion(true);
                toast.success("AI suggested a category!");
            }
        } catch (error) {
            console.error("Suggestion failed:", error);
        } finally {
            setIsSuggesting(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/finance/expenses">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Add Expense</h1>
                    <p className="text-muted-foreground">Record a new expense</p>
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
                                className="text-2xl h-14 font-bold"
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
                                placeholder="What did you spend on?"
                                {...register("description")}
                                onBlur={handleDescriptionBlur}
                            />
                            {isSuggesting && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    ✨ Suggesting category...
                                </p>
                            )}
                            {errors.description && (
                                <p className="text-sm text-destructive">{errors.description.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="category">Category</Label>
                                {hasAiSuggestion && (
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200 text-[10px] h-5 px-1.5 flex items-center gap-1">
                                        <Sparkles className="h-3 w-3" />
                                        AI Suggested
                                    </Badge>
                                )}
                            </div>
                            <Select
                                value={currentCategory}
                                onValueChange={(value) => {
                                    setValue("category", value);
                                    setHasAiSuggestion(false);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: category.color }}
                                                />
                                                {category.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category && (
                                <p className="text-sm text-destructive">{errors.category.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                {...register("date")}
                            />
                            {errors.date && (
                                <p className="text-sm text-destructive">{errors.date.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="note">Note (optional)</Label>
                            <Input
                                id="note"
                                placeholder="Add a note..."
                                {...register("note")}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Expense
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
