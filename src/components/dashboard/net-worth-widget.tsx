"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Landmark, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface NetWorthWidgetProps {
    balance?: number;
    investments?: number;
    debts?: number;
}

export function NetWorthWidget({
    balance = 0,
    investments = 0,
    debts = 0
}: NetWorthWidgetProps) {
    const hasData = balance > 0 || investments > 0 || debts > 0;
    const netWorth = balance + investments - debts;
    const isPositive = netWorth >= 0;

    return (
        <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Net Worth
                </CardTitle>
                <div className="p-2 rounded-lg bg-cyan-500/10">
                    <Landmark className="h-4 w-4 text-cyan-500" />
                </div>
            </CardHeader>
            <CardContent>
                {hasData ? (
                    <div className="space-y-4">
                        {/* Net Worth */}
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">
                                {formatCurrency(netWorth)}
                            </span>
                            {isPositive ? (
                                <TrendingUp className="h-5 w-5 text-green-500" />
                            ) : (
                                <TrendingDown className="h-5 w-5 text-red-500" />
                            )}
                        </div>

                        {/* Breakdown */}
                        <div className="space-y-2 pt-2 border-t">
                            {balance > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Bank Balance</span>
                                    <span className="font-medium text-green-600">+{formatCurrency(balance)}</span>
                                </div>
                            )}
                            {investments > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Investments</span>
                                    <span className="font-medium text-green-600">+{formatCurrency(investments)}</span>
                                </div>
                            )}
                            {debts > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Debts</span>
                                    <span className="font-medium text-red-500">-{formatCurrency(debts)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="py-4 text-center">
                        <p className="text-sm text-muted-foreground mb-3">
                            Track your finances
                        </p>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/finance">
                                <Plus className="h-4 w-4 mr-1" />
                                Add Assets
                            </Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
