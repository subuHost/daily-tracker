"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    TrendingUp,
    Loader2,
    ArrowUpRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getTransactions, type Transaction } from "@/lib/db";

export default function IncomePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadIncome() {
            try {
                const txns = await getTransactions(100);
                // Filter for income only
                const incomeTransactions = txns.filter(t => t.type === "income");
                setTransactions(incomeTransactions);
            } catch (error) {
                console.error("Failed to load income:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadIncome();
    }, []);

    const filteredTransactions = transactions.filter((t) =>
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalIncome = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

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
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Income</h1>
                    <p className="text-muted-foreground text-sm">
                        Total: {formatCurrency(totalIncome)}
                    </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/finance/income/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Income
                    </Link>
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search income..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Income List */}
            {transactions.length > 0 ? (
                <div className="space-y-3">
                    {filteredTransactions.map((transaction) => (
                        <Card key={transaction.id} className="hover:bg-accent/50 transition-colors">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-green-500/10">
                                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{transaction.description}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {transaction.category_name || "Uncategorized"} • {formatDate(transaction.date)}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-semibold text-green-600">
                                        +{formatCurrency(Number(transaction.amount))}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <TrendingUp className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No income recorded</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Start tracking your income sources.
                    </p>
                    <Button asChild>
                        <Link href="/finance/income/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add First Income
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
