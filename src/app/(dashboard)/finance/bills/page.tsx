"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Loader2,
    Check,
    Receipt,
    Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getBills, toggleBillPaid, type Bill } from "@/lib/db";
import { toast } from "sonner";

export default function BillsPage() {
    const [bills, setBills] = useState<Bill[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadBills() {
            try {
                const data = await getBills();
                setBills(data);
            } catch (error) {
                console.error("Failed to load bills:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadBills();
    }, []);

    const handleTogglePaid = async (id: string) => {
        try {
            const updated = await toggleBillPaid(id);
            setBills(bills.map(b => b.id === id ? updated : b));
            toast.success(updated.is_paid ? "Marked as paid!" : "Marked as unpaid");
        } catch (error) {
            console.error("Failed to update bill:", error);
            toast.error("Failed to update");
        }
    };

    const unpaidBills = bills.filter(b => !b.is_paid);
    const paidBills = bills.filter(b => b.is_paid);
    const totalMonthly = unpaidBills.reduce((sum, b) => sum + Number(b.amount), 0);

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
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Bills</h1>
                    <p className="text-muted-foreground text-sm">
                        Pending: {formatCurrency(totalMonthly)}
                    </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/finance/bills/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Bill
                    </Link>
                </Button>
            </div>

            {/* Bills List */}
            {bills.length > 0 ? (
                <div className="space-y-6">
                    {/* Unpaid */}
                    {unpaidBills.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-sm font-medium text-muted-foreground">
                                Pending ({unpaidBills.length})
                            </h2>
                            {unpaidBills.map((bill) => (
                                <Card key={bill.id} className="hover:bg-accent/50 transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-amber-500/10">
                                                    <Receipt className="h-4 w-4 text-amber-500" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{bill.name}</p>
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Due on {bill.due_date}{getOrdinalSuffix(bill.due_date)} • {bill.recurring || "One-time"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <p className="font-semibold">
                                                    {formatCurrency(Number(bill.amount))}
                                                </p>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleTogglePaid(bill.id)}
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
                    {paidBills.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-sm font-medium text-muted-foreground">
                                Paid This Month ({paidBills.length})
                            </h2>
                            {paidBills.map((bill) => (
                                <Card key={bill.id} className="opacity-60">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-green-500/10">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{bill.name}</p>
                                                    <p className="text-sm text-muted-foreground">Paid</p>
                                                </div>
                                            </div>
                                            <p className="font-semibold text-muted-foreground">
                                                {formatCurrency(Number(bill.amount))}
                                            </p>
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
                        <Receipt className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No bills yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Track your recurring bills and never miss a payment.
                    </p>
                    <Button asChild>
                        <Link href="/finance/bills/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add First Bill
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}

function getOrdinalSuffix(day: number): string {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
}
