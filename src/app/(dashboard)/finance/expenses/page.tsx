"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
    Plus,
    Search,
    Filter,
    ArrowDownRight,
    ChevronLeft,
} from "lucide-react";

interface Expense {
    id: string;
    description: string;
    amount: number;
    date: string;
    category: string;
    categoryColor: string;
}

const sampleExpenses: Expense[] = [
    { id: "1", description: "Grocery Shopping", amount: 2450, date: "2026-01-21", category: "Food", categoryColor: "#ef4444" },
    { id: "2", description: "Netflix Subscription", amount: 649, date: "2026-01-19", category: "Entertainment", categoryColor: "#eab308" },
    { id: "3", description: "Uber Ride", amount: 285, date: "2026-01-18", category: "Transport", categoryColor: "#f97316" },
    { id: "4", description: "Coffee at Starbucks", amount: 380, date: "2026-01-18", category: "Food", categoryColor: "#ef4444" },
    { id: "5", description: "Phone Bill", amount: 599, date: "2026-01-15", category: "Bills", categoryColor: "#3b82f6" },
    { id: "6", description: "Amazon Purchase", amount: 1299, date: "2026-01-14", category: "Shopping", categoryColor: "#22c55e" },
    { id: "7", description: "Gym Membership", amount: 1500, date: "2026-01-10", category: "Health", categoryColor: "#8b5cf6" },
    { id: "8", description: "Electricity Bill", amount: 2100, date: "2026-01-08", category: "Bills", categoryColor: "#3b82f6" },
];

export default function ExpensesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [expenses] = useState<Expense[]>(sampleExpenses);

    const filteredExpenses = expenses.filter((expense) =>
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/finance">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
                    <p className="text-muted-foreground">Track your daily spending</p>
                </div>
                <Button asChild>
                    <Link href="/finance/expenses/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Expense
                    </Link>
                </Button>
            </div>

            {/* Summary */}
            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <CardContent className="p-6">
                    <p className="text-red-100 text-sm">This Month&apos;s Total</p>
                    <p className="text-3xl font-bold mt-1">{formatCurrency(totalExpenses)}</p>
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
                <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            {/* Expenses List */}
            <div className="space-y-3">
                {filteredExpenses.map((expense) => (
                    <Card key={expense.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-red-500/10">
                                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{expense.description}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span
                                                className="inline-block w-2 h-2 rounded-full"
                                                style={{ backgroundColor: expense.categoryColor }}
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                {expense.category}
                                            </span>
                                            <span className="text-xs text-muted-foreground">•</span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(expense.date)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p className="font-semibold text-red-500">
                                    -{formatCurrency(expense.amount)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filteredExpenses.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No expenses found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
