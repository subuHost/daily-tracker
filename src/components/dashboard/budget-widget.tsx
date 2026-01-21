"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { Wallet } from "lucide-react";

interface BudgetWidgetProps {
    budget: number;
    spent: number;
}

export function BudgetWidget({ budget = 50000, spent = 32500 }: BudgetWidgetProps) {
    const remaining = budget - spent;
    const percentage = Math.min((spent / budget) * 100, 100);
    const isOverBudget = spent > budget;

    return (
        <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Monthly Budget
                </CardTitle>
                <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Wallet className="h-4 w-4 text-emerald-500" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div>
                        <div className="text-2xl font-bold">
                            {formatCurrency(remaining)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            remaining of {formatCurrency(budget)}
                        </p>
                    </div>
                    <Progress
                        value={percentage}
                        className={`h-2 ${isOverBudget ? "[&>div]:bg-destructive" : "[&>div]:bg-emerald-500"}`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Spent: {formatCurrency(spent)}</span>
                        <span>{percentage.toFixed(0)}%</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
