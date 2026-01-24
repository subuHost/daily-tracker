"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
    Plus,
    Search,
    Filter,
    ArrowDownRight,
    ChevronLeft,
    Receipt,
    Loader2,
} from "lucide-react";
import { getTransactions, deleteTransaction, type Transaction } from "@/lib/db";
import { SwipeableListItem } from "@/components/ui/swipeable-list-item";
import { useHaptic } from "@/hooks/use-haptic";
import { toast } from "sonner";

interface Expense {
    id: string;
    description: string;
    amount: number;
    date: string;
    category: string;
    categoryColor: string;
}

export default function ExpensesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const haptic = useHaptic();

    // Fetch expenses on mount
    useEffect(() => {
        async function loadExpenses() {
            try {
                // Get current month's date range
                const now = new Date();
                const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
                const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${lastDay}`;

                const transactions = await getTransactions(100, startDate, endDate);

                // Filter only expenses and map to UI format
                const expenseList = transactions
                    .filter((t) => t.type === "expense")
                    .map((t) => ({
                        id: t.id,
                        description: t.description,
                        amount: Number(t.amount),
                        date: t.date,
                        category: t.category_name || "Uncategorized",
                        categoryColor: t.category_color || "#6b7280",
                    }));

                setExpenses(expenseList);
            } catch (error) {
                console.error("Failed to load expenses:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadExpenses();
    }, []);

    const filteredExpenses = expenses.filter((expense) =>
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const handleDeleteExpense = async (id: string) => {
        try {
            await deleteTransaction(id);
            setExpenses(expenses.filter(e => e.id !== id));
            haptic.triggerImpact();
            toast.success("Expense deleted");
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete expense");
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
            <div className="flex items-center gap-3 sm:gap-4">
                <Button variant="ghost" size="icon" asChild className="shrink-0">
                    <Link href="/finance">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Expenses</h1>
                    <p className="text-muted-foreground text-sm">Track your daily spending</p>
                </div>
                <Button asChild className="shrink-0">
                    <Link href="/finance/expenses/new">
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Add Expense</span>
                    </Link>
                </Button>
            </div>

            {/* Summary */}
            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <CardContent className="p-4 sm:p-6">
                    <p className="text-red-100 text-sm">This Month&apos;s Total</p>
                    <p className="text-2xl sm:text-3xl font-bold mt-1">{formatCurrency(totalExpenses)}</p>
                </CardContent>
            </Card>

            {/* Search & Filter */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search expenses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline" size="icon" className="shrink-0">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            {/* Expenses List */}
            {expenses.length > 0 ? (
                <div className="space-y-3">
                    {filteredExpenses.map((expense) => (
                        <SwipeableListItem
                            key={expense.id}
                            onDelete={() => handleDeleteExpense(expense.id)}
                        >
                            <Card className="hover:bg-accent/50 transition-colors">
                                <CardContent className="p-3 sm:p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                            <div className="p-1.5 sm:p-2 rounded-full bg-red-500/10 shrink-0">
                                                <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm sm:text-base truncate">{expense.description}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span
                                                        className="inline-block w-2 h-2 rounded-full shrink-0"
                                                        style={{ backgroundColor: expense.categoryColor }}
                                                    />
                                                    <span className="text-xs text-muted-foreground truncate">
                                                        {expense.category}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">•</span>
                                                    <span className="text-xs text-muted-foreground shrink-0">
                                                        {formatDate(expense.date)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="font-semibold text-red-500 shrink-0 text-sm sm:text-base">
                                            -{formatCurrency(expense.amount)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </SwipeableListItem>
                    ))}

                    {filteredExpenses.length === 0 && expenses.length > 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No expenses found for "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Receipt className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No expenses yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Start tracking your spending by adding your first expense.
                    </p>
                    <Button asChild>
                        <Link href="/finance/expenses/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Your First Expense
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
