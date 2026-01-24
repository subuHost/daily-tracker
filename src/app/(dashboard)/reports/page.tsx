"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import {
    Download,
    TrendingUp,
    TrendingDown,
    Target,
    Wallet,
    Loader2,
    Smile,
    Calendar as CalendarIcon,
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
} from "recharts";
import { toast } from "sonner";
import { getStats, getCategoryBreakdownRange, getHabits, getMoodStats, getInvestments } from "@/lib/db";
import { startOfMonth, endOfMonth, format, subMonths, startOfYear } from "date-fns";

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState({
        start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
        end: format(new Date(), "yyyy-MM-dd"),
    });

    const [isLoading, setIsLoading] = useState(true);
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [categoryBreakdown, setCategoryBreakdown] = useState<{ name: string; value: number; color: string }[]>([]);
    const [habitData, setHabitData] = useState<{ name: string; completed: number; total: number }[]>([]);
    const [moodStats, setMoodStats] = useState<{ average: number; breakdown: any[] }>({ average: 0, breakdown: [] });
    const [portfolioValue, setPortfolioValue] = useState(0);

    const loadReportData = async () => {
        setIsLoading(true);
        try {
            // Fetch financial stats for range
            const stats = await getStats(dateRange.start, dateRange.end);
            setTotalIncome(stats.totalIncome);
            setTotalExpenses(stats.totalExpenses);

            // Fetch category breakdown for range
            const categories = await getCategoryBreakdownRange(dateRange.start, dateRange.end);
            setCategoryBreakdown(categories);

            // Fetch habit data (not date ranged yet, usually lifetime or monthly, maybe we iterate later)
            // For now, habits are lifetime stats in current implementation
            const habits = await getHabits();
            const habitStats = habits.map(h => ({
                name: h.name,
                completed: h.completedDays,
                total: Math.max(h.totalDays, 1),
            }));
            setHabitData(habitStats.slice(0, 4));

            // Fetch Mood Stats for range
            const moodData = await getMoodStats(undefined, undefined, dateRange.start, dateRange.end);
            const moodChartData = Object.entries(moodData.breakdown).map(([rating, count]) => ({
                name: ["Terrible", "Bad", "Okay", "Good", "Great"][Number(rating) - 1] || "Unknown",
                value: count,
                color: ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"][Number(rating) - 1] || "#888888"
            }));
            setMoodStats({ average: moodData.average, breakdown: moodChartData });

            // Fetch Portfolio Value (Lifetime)
            const investments = await getInvestments();
            const totalValue = investments.reduce((sum, inv) => sum + (inv.buy_price * inv.quantity), 0);
            setPortfolioValue(totalValue);

        } catch (error) {
            console.error("Failed to load report data:", error);
            toast.error("Failed to load reports");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadReportData();
    }, [dateRange]);

    const handlePresetChange = (preset: string) => {
        const now = new Date();
        let start = now;
        let end = now;

        switch (preset) {
            case "thisMonth":
                start = startOfMonth(now);
                end = now; // to today
                break;
            case "lastMonth":
                start = startOfMonth(subMonths(now, 1));
                end = endOfMonth(subMonths(now, 1));
                break;
            case "thisYear":
                start = startOfYear(now);
                end = now;
                break;
        }
        setDateRange({
            start: format(start, "yyyy-MM-dd"),
            end: format(end, "yyyy-MM-dd"),
        });
    };

    const handleExport = (type: string) => {
        toast.success(`Exporting ${type} report as CSV...`);
    };

    const savings = totalIncome - totalExpenses;

    // Mood Emoji based on average
    const getMoodEmoji = (avg: number) => {
        if (avg >= 4.5) return "😄";
        if (avg >= 3.5) return "🙂";
        if (avg >= 2.5) return "😐";
        if (avg >= 1.5) return "😔";
        return "😢";
    };

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground">Analytics and insights</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handlePresetChange("thisMonth")}>This Month</Button>
                        <Button variant="outline" size="sm" onClick={() => handlePresetChange("lastMonth")}>Last Month</Button>
                        <Button variant="outline" size="sm" onClick={() => handlePresetChange("thisYear")}>This Year</Button>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md border">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground ml-2" />
                        <Input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))}
                            className="h-8 w-32 bg-transparent border-0 focus-visible:ring-0 p-0 text-sm"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))}
                            className="h-8 w-32 bg-transparent border-0 focus-visible:ring-0 p-0 text-sm"
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
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
                                    <Wallet className="h-4 w-4 text-cyan-500" />
                                    <span className="text-xs">Portfolio</span>
                                </div>
                                <p className="text-xl font-bold text-cyan-600">
                                    {formatCurrency(portfolioValue)}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="col-span-2 md:col-span-1">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Smile className="h-4 w-4 text-yellow-500" />
                                    <span className="text-xs">Avg Mood</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{getMoodEmoji(moodStats.average)}</span>
                                    <span className="text-lg font-bold">{moodStats.average.toFixed(1)}/5</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row 1 */}
                    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                        {/* Category Breakdown */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">Expenses by Category</CardTitle>
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
                                {categoryBreakdown.length > 0 ? (
                                    <>
                                        <div className="h-[250px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={categoryBreakdown}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={90}
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
                                                    <span className="text-xs text-muted-foreground truncate">{cat.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                        No expenses in this period
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Mood Breakdown */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">Mood History</CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleExport("mood")}
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    CSV
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={moodStats.breakdown}>
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                            <YAxis hide />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{
                                                    backgroundColor: "hsl(var(--card))",
                                                    border: "1px solid hsl(var(--border))",
                                                    borderRadius: "8px",
                                                }}
                                            />
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                {moodStats.breakdown.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row 2 */}
                    <div className="grid gap-6 grid-cols-1">
                        {/* Habit Completion */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">Habit Consistency (Lifetime)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {habitData.map((habit) => (
                                        <div key={habit.name} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span>{habit.name}</span>
                                                <span className="text-muted-foreground">
                                                    {habit.completed}/{habit.total} days ({Math.round((habit.completed / habit.total) * 100)}%)
                                                </span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${(habit.completed / habit.total) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
