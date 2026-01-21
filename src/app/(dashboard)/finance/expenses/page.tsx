"use client";

import { useState } from "react";
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
} from "lucide-react";

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
    const [expenses] = useState<Expense[]>([]);

    const filteredExpenses = expenses.filter((expense) =>
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

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
                        <Card key={expense.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
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
