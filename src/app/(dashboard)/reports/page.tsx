"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
    Download,
    FileSpreadsheet,
    Calendar,
    TrendingUp,
    TrendingDown,
    Target,
    Wallet,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts";
import { toast } from "sonner";

const monthlyExpenses = [
    { month: "Aug", amount: 42000 },
    { month: "Sep", amount: 45000 },
    { month: "Oct", amount: 48000 },
    { month: "Nov", amount: 52000 },
    { month: "Dec", amount: 62000 },
    { month: "Jan", amount: 47500 },
];

const categoryBreakdown = [
    { name: "Food", value: 12000, color: "#ef4444" },
    { name: "Transport", value: 5000, color: "#f97316" },
    { name: "Entertainment", value: 4000, color: "#eab308" },
    { name: "Shopping", value: 8000, color: "#22c55e" },
    { name: "Bills", value: 15000, color: "#3b82f6" },
    { name: "Other", value: 3500, color: "#8b5cf6" },
];

const habitData = [
    { name: "Gym", completed: 18, total: 21 },
    { name: "Reading", completed: 15, total: 21 },
    { name: "Meditation", completed: 10, total: 21 },
    { name: "Water", completed: 19, total: 21 },
];

const investmentPerformance = [
    { month: "Aug", value: 320000 },
    { month: "Sep", value: 335000 },
    { month: "Oct", value: 328000 },
    { month: "Nov", value: 345000 },
    { month: "Dec", value: 355000 },
    { month: "Jan", value: 365000 },
];

export default function ReportsPage() {
    const [period, setPeriod] = useState<"month" | "year">("month");

    const handleExport = (type: string) => {
        toast.success(`Exporting ${type} report as CSV...`);
    };

    const totalExpenses = categoryBreakdown.reduce((sum, cat) => sum + cat.value, 0);
    const totalIncome = 75000;
    const savings = totalIncome - totalExpenses;
    const savingsRate = Math.round((savings / totalIncome) * 100);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground">Analytics and insights</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={period === "month" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPeriod("month")}
                    >
                        Monthly
                    </Button>
                    <Button
                        variant={period === "year" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPeriod("year")}
                    >
                        Yearly
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-xs">Income</span>
                        </div>
                        <p className="text-xl font-bold text-green-600">
                            {formatCurrency(totalIncome)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            <span className="text-xs">Expenses</span>
                        </div>
                        <p className="text-xl font-bold text-red-500">
                            {formatCurrency(totalExpenses)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Wallet className="h-4 w-4 text-blue-500" />
                            <span className="text-xs">Savings</span>
                        </div>
                        <p className="text-xl font-bold text-blue-500">
                            {formatCurrency(savings)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Target className="h-4 w-4 text-purple-500" />
                            <span className="text-xs">Savings Rate</span>
                        </div>
                        <p className="text-xl font-bold text-purple-500">{savingsRate}%</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Monthly Expenses Trend */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Expense Trend</CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport("expenses")}
                        >
                            <Download className="h-4 w-4 mr-1" />
                            CSV
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyExpenses}>
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v) => `₹${v / 1000}k`}
                                    />
                                    <Tooltip
                                        formatter={(v: number) => formatCurrency(v)}
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Breakdown */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">By Category</CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport("categories")}
                        >
                            <Download className="h-4 w-4 mr-1" />
                            CSV
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {categoryBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(v: number) => formatCurrency(v)}
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {categoryBreakdown.map((cat) => (
                                <div key={cat.name} className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: cat.color }}
                                    />
                                    <span className="text-xs text-muted-foreground">{cat.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Habit Completion */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Habit Completion</CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport("habits")}
                        >
                            <Download className="h-4 w-4 mr-1" />
                            CSV
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {habitData.map((habit) => (
                                <div key={habit.name} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span>{habit.name}</span>
                                        <span className="text-muted-foreground">
                                            {habit.completed}/{habit.total} ({Math.round((habit.completed / habit.total) * 100)}%)
                                        </span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 rounded-full"
                                            style={{ width: `${(habit.completed / habit.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Investment Performance */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Portfolio Value</CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport("investments")}
                        >
                            <Download className="h-4 w-4 mr-1" />
                            CSV
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={investmentPerformance}>
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v) => `₹${v / 1000}k`}
                                    />
                                    <Tooltip
                                        formatter={(v: number) => formatCurrency(v)}
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#22c55e"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 mt-4 text-sm">
                            <div className="text-center">
                                <p className="text-muted-foreground">Current</p>
                                <p className="font-bold text-green-500">{formatCurrency(365000)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-muted-foreground">Gain</p>
                                <p className="font-bold text-green-500">+{formatCurrency(45000)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
