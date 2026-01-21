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
    ArrowRight,
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

// Sample data
const monthlyData = [
    { month: "Aug", income: 65000, expenses: 42000 },
    { month: "Sep", income: 68000, expenses: 45000 },
    { month: "Oct", income: 72000, expenses: 48000 },
    { month: "Nov", income: 70000, expenses: 52000 },
    { month: "Dec", income: 85000, expenses: 62000 },
    { month: "Jan", income: 75000, expenses: 38000 },
];

const categoryData = [
    { name: "Food", value: 12000, color: "#ef4444" },
    { name: "Transport", value: 5000, color: "#f97316" },
    { name: "Entertainment", value: 4000, color: "#eab308" },
    { name: "Shopping", value: 8000, color: "#22c55e" },
    { name: "Bills", value: 15000, color: "#3b82f6" },
    { name: "Other", value: 3500, color: "#8b5cf6" },
];

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
    const totalIncome = 75000;
    const totalExpenses = 47500;
    const savings = totalIncome - totalExpenses;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
                    <p className="text-muted-foreground">
                        Manage your money and track spending
                    </p>
                </div>
                <Button asChild>
                    <Link href="/finance/expenses/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Expense
                    </Link>
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            This Month&apos;s Income
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            +{formatCurrency(totalIncome)}
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
                        <div className="text-2xl font-bold text-red-500">
                            -{formatCurrency(totalExpenses)}
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
                        <div className="text-2xl font-bold text-blue-500">
                            {formatCurrency(savings)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
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

            {/* Finance Sections */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                {financeCards.map((card) => (
                    <Link key={card.title} href={card.href}>
                        <Card className="h-full hover:bg-accent transition-colors group">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <div className={`p-3 rounded-xl ${card.bgColor} mb-3`}>
                                    <card.icon className={`h-6 w-6 ${card.color}`} />
                                </div>
                                <h3 className="font-medium text-sm">{card.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">
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
