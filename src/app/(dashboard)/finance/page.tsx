"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    CreditCard,
    PiggyBank,
    Receipt,
    Plus,
} from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";

const financeCards = [
    {
        title: "Expenses",
        description: "Track daily expenses",
        href: "/finance/expenses",
        icon: Receipt,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
    },
    {
        title: "Income",
        description: "Record income sources",
        href: "/finance/income",
        icon: TrendingUp,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
    },
    {
        title: "Budget",
        description: "Set monthly budgets",
        href: "/finance/budget",
        icon: PiggyBank,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
    },
    {
        title: "Debts",
        description: "Track lending & borrowing",
        href: "/finance/debts",
        icon: CreditCard,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
    },
    {
        title: "Bills",
        description: "Manage recurring bills",
        href: "/finance/bills",
        icon: Wallet,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
    },
    {
        title: "Investments",
        description: "Portfolio tracker",
        href: "/finance/investments",
        icon: TrendingDown,
        color: "text-cyan-500",
        bgColor: "bg-cyan-500/10",
    },
];

export default function FinancePage() {
    // Empty state - no data initially
    const hasData = false;
    const totalIncome = 0;
    const totalExpenses = 0;
    const savings = totalIncome - totalExpenses;

    // Empty chart data
    const monthlyData: { month: string; income: number; expenses: number }[] = [];
    const categoryData: { name: string; value: number; color: string }[] = [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Finance</h1>
                    <p className="text-muted-foreground text-sm">
                        Manage your money and track spending
                    </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/finance/expenses/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Expense
                    </Link>
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            This Month&apos;s Income
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold text-green-600">
                            {hasData ? `+${formatCurrency(totalIncome)}` : "₹0"}
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            This Month&apos;s Expenses
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold text-red-500">
                            {hasData ? `-${formatCurrency(totalExpenses)}` : "₹0"}
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <PiggyBank className="h-4 w-4 text-blue-500" />
                            Savings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold text-blue-500">
                            {formatCurrency(savings)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts or Empty State */}
            {hasData ? (
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                    {/* Spending by Category */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Spending by Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "8px",
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-4">
                                {categoryData.map((category) => (
                                    <div key={category.name} className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: category.color }}
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            {category.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Income vs Expenses Trend */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Income vs Expenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyData}>
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => `₹${value / 1000}k`}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--card))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "8px",
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="income"
                                            stroke="#22c55e"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="expenses"
                                            stroke="#ef4444"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-6 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <span className="text-sm text-muted-foreground">Income</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <span className="text-sm text-muted-foreground">Expenses</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <Wallet className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No financial data yet</h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                            Start tracking your finances by adding your first transaction.
                        </p>
                        <Button asChild>
                            <Link href="/finance/expenses/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Your First Expense
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Finance Sections */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                {financeCards.map((card) => (
                    <Link key={card.title} href={card.href}>
                        <Card className="h-full hover:bg-accent transition-colors group">
                            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
                                <div className={`p-2 sm:p-3 rounded-xl ${card.bgColor} mb-2 sm:mb-3`}>
                                    <card.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.color}`} />
                                </div>
                                <h3 className="font-medium text-xs sm:text-sm">{card.title}</h3>
                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">
                                    {card.description}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
