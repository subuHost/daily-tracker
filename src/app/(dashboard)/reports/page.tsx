"use client";

import { useState, useEffect } from "react";
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
    Loader2,
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
import { getMonthlyStats, getCategoryBreakdown, getHabits } from "@/lib/db";

export default function ReportsPage() {
    const [period, setPeriod] = useState<"month" | "year">("month");
    const [isLoading, setIsLoading] = useState(true);
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [categoryBreakdown, setCategoryBreakdown] = useState<{ name: string; value: number; color: string }[]>([]);
    const [habitData, setHabitData] = useState<{ name: string; completed: number; total: number }[]>([]);

    useEffect(() => {
        async function loadReportData() {
            try {
                const now = new Date();
                const month = now.getMonth() + 1;
                const year = now.getFullYear();

                // Fetch monthly stats
                const stats = await getMonthlyStats(month, year);
                setTotalIncome(stats.totalIncome);
                setTotalExpenses(stats.totalExpenses);

                // Fetch category breakdown
                const categories = await getCategoryBreakdown(month, year);
                setCategoryBreakdown(categories);

                // Fetch habit data
                const habits = await getHabits();
                const habitStats = habits.map(h => ({
                    name: h.name,
                    completed: h.completedDays,
                    total: Math.min(h.totalDays, 30), // Cap at 30 days for display
                }));
                setHabitData(habitStats.slice(0, 4)); // Top 4 habits
            } catch (error) {
                console.error("Failed to load report data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadReportData();
    }, []);

    const handleExport = (type: string) => {
        toast.success(`Exporting ${type} report as CSV...`);
    };

    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;
    const hasData = totalIncome > 0 || totalExpenses > 0;

    // Generate monthly expense trend (placeholder - would need historical data)
    const monthlyExpenses = hasData ? [
        { month: "This Month", amount: totalExpenses },
    ] : [];

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
                        <div className="h-[200px] flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                                <Wallet className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                <p>No investment data yet</p>
                                <p className="text-xs mt-1">Add investments to track portfolio</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
