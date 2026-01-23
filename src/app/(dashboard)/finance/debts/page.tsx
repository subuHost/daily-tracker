"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    Check,
    Wallet,
    RotateCcw,
    Pencil,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getDebts, updateDebtStatus, type Debt } from "@/lib/db";
import { toast } from "sonner";

export default function DebtsPage() {
    const [debts, setDebts] = useState<Debt[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadDebts() {
            try {
                const data = await getDebts();
                setDebts(data);
            } catch (error) {
                console.error("Failed to load debts:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadDebts();
    }, []);

    const handleMarkPaid = async (id: string) => {
        try {
            await updateDebtStatus(id, "paid");
            setDebts(debts.map(d => d.id === id ? { ...d, status: "paid" } : d));
            toast.success("Marked as paid!");
        } catch (error) {
            console.error("Failed to update debt:", error);
            toast.error("Failed to update");
        }
    };

    const handleReopen = async (id: string) => {
        try {
            await updateDebtStatus(id, "pending");
            setDebts(debts.map(d => d.id === id ? { ...d, status: "pending" } : d));
            toast.success("Debt reopened!");
        } catch (error) {
            console.error("Failed to reopen debt:", error);
            toast.error("Failed to reopen");
        }
    };

    const pendingDebts = debts.filter(d => d.status === "pending");
    const paidDebts = debts.filter(d => d.status === "paid");

    const totalLent = pendingDebts
        .filter(d => d.type === "lend")
        .reduce((sum, d) => sum + Number(d.amount), 0);

    const totalBorrowed = pendingDebts
        .filter(d => d.type === "borrow")
        .reduce((sum, d) => sum + Number(d.amount), 0);

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
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Debts</h1>
                    <p className="text-muted-foreground text-sm">
                        Track money lent and borrowed
                    </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/finance/debts/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Debt
                    </Link>
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Money Lent</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(totalLent)}</p>
                    </CardContent>
                </Card>
                <Card className="bg-red-500/10 border-red-500/20">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Money Borrowed</p>
                        <p className="text-2xl font-bold text-red-500">{formatCurrency(totalBorrowed)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Debts List */}
            {debts.length > 0 ? (
                <div className="space-y-6">
                    {/* Pending */}
                    {pendingDebts.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-sm font-medium text-muted-foreground">
                                Pending ({pendingDebts.length})
                            </h2>
                            {pendingDebts.map((debt) => (
                                <Card key={debt.id} className="hover:bg-accent/50 transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${debt.type === "lend"
                                                    ? "bg-green-500/10"
                                                    : "bg-red-500/10"
                                                    }`}>
                                                    {debt.type === "lend" ? (
                                                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{debt.person}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {debt.type === "lend" ? "You lent" : "You borrowed"} • {formatDate(debt.date)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className={`font-semibold ${debt.type === "lend" ? "text-green-600" : "text-red-500"
                                                    }`}>
                                                    {formatCurrency(Number(debt.amount))}
                                                </p>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    asChild
                                                >
                                                    <Link href={`/finance/debts/${debt.id}/edit`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleMarkPaid(debt.id)}
                                                    title="Mark as paid"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Paid */}
                    {paidDebts.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-sm font-medium text-muted-foreground">
                                Settled ({paidDebts.length})
                            </h2>
                            {paidDebts.slice(0, 5).map((debt) => (
                                <Card key={debt.id} className="opacity-70 hover:opacity-100 transition-opacity">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-green-500/10">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{debt.person}</p>
                                                    <p className="text-sm text-muted-foreground">Settled</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-muted-foreground">
                                                    {formatCurrency(Number(debt.amount))}
                                                </p>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleReopen(debt.id)}
                                                    title="Reopen debt"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Wallet className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No debts recorded</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Track money you lend or borrow from others.
                    </p>
                    <Button asChild>
                        <Link href="/finance/debts/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add First Debt
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
