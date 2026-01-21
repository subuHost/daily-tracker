"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { Wallet, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface BudgetWidgetProps {
    budget?: number;
    spent?: number;
}

export function BudgetWidget({ budget, spent }: BudgetWidgetProps) {
    const hasData = budget !== undefined && budget > 0;
    const remaining = hasData ? budget - (spent || 0) : 0;
    const percentage = hasData ? Math.min(((spent || 0) / budget) * 100, 100) : 0;
    const isOverBudget = hasData && (spent || 0) > budget;

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
                {hasData ? (
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
                            <span>Spent: {formatCurrency(spent || 0)}</span>
                            <span>{percentage.toFixed(0)}%</span>
                        </div>
                    </div>
                ) : (
                    <div className="py-4 text-center">
                        <p className="text-sm text-muted-foreground mb-3">
                            No budget set yet
                        </p>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/settings">
                                <Plus className="h-4 w-4 mr-1" />
                                Set Budget
                            </Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
