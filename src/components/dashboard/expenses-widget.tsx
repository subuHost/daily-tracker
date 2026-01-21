"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Receipt } from "lucide-react";

interface Transaction {
    id: string;
    description: string;
    amount: number;
    date: string;
    type: "expense" | "income";
    category: string;
}

interface ExpensesWidgetProps {
    transactions?: Transaction[];
}

const defaultTransactions: Transaction[] = [
    { id: "1", description: "Grocery Shopping", amount: 2450, date: "2026-01-21", type: "expense", category: "Food" },
    { id: "2", description: "Freelance Payment", amount: 15000, date: "2026-01-20", type: "income", category: "Work" },
    { id: "3", description: "Netflix Subscription", amount: 649, date: "2026-01-19", type: "expense", category: "Entertainment" },
    { id: "4", description: "Uber Ride", amount: 285, date: "2026-01-18", type: "expense", category: "Transport" },
    { id: "5", description: "Coffee", amount: 180, date: "2026-01-18", type: "expense", category: "Food" },
];

export function ExpensesWidget({ transactions = defaultTransactions }: ExpensesWidgetProps) {
    return (
        <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Recent Transactions
                </CardTitle>
                <div className="p-2 rounded-lg bg-purple-500/10">
                    <Receipt className="h-4 w-4 text-purple-500" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {transactions.slice(0, 5).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-full ${transaction.type === "income"
                                        ? "bg-green-500/10"
                                        : "bg-red-500/10"
                                    }`}>
                                    {transaction.type === "income" ? (
                                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                                    ) : (
                                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium truncate max-w-[120px]">
                                        {transaction.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {transaction.category}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-sm font-medium ${transaction.type === "income" ? "text-green-500" : ""
                                    }`}>
                                    {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatShortDate(transaction.date)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
