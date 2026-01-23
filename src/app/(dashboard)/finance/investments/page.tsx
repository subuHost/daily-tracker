"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Loader2,
    TrendingUp,
    TrendingDown,
    LineChart,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getInvestments, getInvestmentSummary, type Investment } from "@/lib/db";

export default function InvestmentsPage() {
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [summary, setSummary] = useState({ totalInvested: 0, currentValue: 0, totalGain: 0, gainPercent: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadInvestments() {
            try {
                const [data, summaryData] = await Promise.all([
                    getInvestments(),
                    getInvestmentSummary(),
                ]);
                setInvestments(data);
                setSummary(summaryData);
            } catch (error) {
                console.error("Failed to load investments:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadInvestments();
    }, []);

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
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Investments</h1>
                    <p className="text-muted-foreground text-sm">
                        Track your portfolio
                    </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/finance/investments/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Investment
                    </Link>
                </Button>
            </div>

            {/* Summary Cards */}
            {investments.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Invested</p>
                            <p className="text-2xl font-bold">{formatCurrency(summary.totalInvested)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Current Value</p>
                            <p className="text-2xl font-bold">{formatCurrency(summary.currentValue)}</p>
                        </CardContent>
                    </Card>
                    <Card className={summary.totalGain >= 0 ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
                            <p className={`text-2xl font-bold ${summary.totalGain >= 0 ? "text-green-600" : "text-red-500"}`}>
                                {summary.totalGain >= 0 ? "+" : ""}{formatCurrency(summary.totalGain)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Returns</p>
                            <p className={`text-2xl font-bold ${summary.gainPercent >= 0 ? "text-green-600" : "text-red-500"}`}>
                                {summary.gainPercent >= 0 ? "+" : ""}{summary.gainPercent.toFixed(2)}%
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Investments List */}
            {investments.length > 0 ? (
                <div className="space-y-3">
                    {investments.map((investment) => {
                        const invested = Number(investment.buy_price) * Number(investment.quantity);
                        const current = (investment.current_price || investment.buy_price) * Number(investment.quantity);
                        const gain = current - invested;
                        const gainPercent = ((current - invested) / invested) * 100;

                        return (
                            <Card key={investment.id} className="hover:bg-accent/50 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${gain >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                                                {gain >= 0 ? (
                                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{investment.symbol}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {investment.name || investment.type} • {Number(investment.quantity)} units
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatCurrency(current)}</p>
                                            <p className={`text-sm ${gain >= 0 ? "text-green-600" : "text-red-500"}`}>
                                                {gain >= 0 ? "+" : ""}{formatCurrency(gain)} ({gainPercent.toFixed(1)}%)
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <LineChart className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No investments yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Start tracking your stocks, crypto, and mutual funds.
                    </p>
                    <Button asChild>
                        <Link href="/finance/investments/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add First Investment
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
