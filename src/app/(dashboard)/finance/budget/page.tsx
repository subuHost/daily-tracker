"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
    ChevronLeft,
    Loader2,
    PiggyBank,
    Save,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getCurrentBudget, setBudget, getMonthlySpent } from "@/lib/db";
import { toast } from "sonner";

export default function BudgetPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [budget, setBudgetValue] = useState<number>(0);
    const [spent, setSpent] = useState<number>(0);
    const [newBudget, setNewBudget] = useState<string>("");

    useEffect(() => {
        async function loadBudgetData() {
            try {
                const [currentBudget, monthlySpent] = await Promise.all([
                    getCurrentBudget(),
                    getMonthlySpent(),
                ]);
                if (currentBudget) {
                    setBudgetValue(Number(currentBudget.amount));
                    setNewBudget(String(currentBudget.amount));
                }
                setSpent(monthlySpent);
            } catch (error) {
                console.error("Failed to load budget:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadBudgetData();
    }, []);

    const handleSaveBudget = async () => {
        if (!newBudget || isNaN(parseFloat(newBudget))) {
            toast.error("Please enter a valid amount");
            return;
        }

        setIsSaving(true);
        try {
            const now = new Date();
            await setBudget(parseFloat(newBudget), now.getMonth() + 1, now.getFullYear());
            setBudgetValue(parseFloat(newBudget));
            toast.success("Budget updated successfully!");
        } catch (error) {
            console.error("Failed to save budget:", error);
            toast.error("Failed to save budget. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const remaining = budget - spent;
    const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const isOverBudget = spent > budget && budget > 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/finance">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Budget</h1>
                    <p className="text-muted-foreground">Set your monthly budget</p>
                </div>
            </div>

            {/* Current Budget Status */}
            {budget > 0 && (
                <Card className="bg-gradient-to-r from-emerald-500/10 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <PiggyBank className="h-4 w-4" />
                            This Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="text-3xl font-bold">
                                {formatCurrency(remaining)}
                            </div>
                            <p className={`text-sm ${isOverBudget ? "text-red-500" : "text-muted-foreground"}`}>
                                {isOverBudget ? "Over budget!" : `remaining of ${formatCurrency(budget)}`}
                            </p>
                        </div>
                        <Progress
                            value={percentage}
                            className={`h-3 ${isOverBudget ? "[&>div]:bg-destructive" : "[&>div]:bg-emerald-500"}`}
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Spent: {formatCurrency(spent)}</span>
                            <span>{percentage.toFixed(0)}%</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Set Budget Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {budget > 0 ? "Update Budget" : "Set Monthly Budget"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="budget">Budget Amount (₹)</Label>
                        <Input
                            id="budget"
                            type="number"
                            placeholder="e.g., 50000"
                            value={newBudget}
                            onChange={(e) => setNewBudget(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Set how much you want to spend this month
                        </p>
                    </div>

                    <Button
                        onClick={handleSaveBudget}
                        className="w-full"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        {budget > 0 ? "Update Budget" : "Set Budget"}
                    </Button>
                </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-muted/50">
                <CardContent className="p-4">
                    <h3 className="font-medium mb-2">💡 Budgeting Tips</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Track your expenses daily</li>
                        <li>• Save at least 20% of your income</li>
                        <li>• Review your budget monthly</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
