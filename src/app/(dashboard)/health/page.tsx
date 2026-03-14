"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Activity, Flame, GlassWater, Moon, Scale, Plus, Utensils, Sparkles } from "lucide-react";
import { ImageUploadButton, ImageThumbnails } from "@/components/ui/image-upload-button";
import {
    getFoodLogs,
    getHealthMetrics,
    getHealthTrend,
    getDailyCalorieTotals,
    type FoodLog,
    type HealthMetric,
    type HealthTrendPoint,
    type DailyCalorieSummary
} from "@/lib/db/health";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine, Legend
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { logHealthMetrics, logFood } from "@/lib/db/health";
import { getUserPreferences, saveUserPreferences, type UserPreferences } from "@/app/actions/preferences";
import { toast } from "sonner";
import { format } from "date-fns";

const COLORS = ["#3b82f6", "#ef4444", "#fbbf24"]; // Protein (Blue), fats (Red), Carbs (Yellow)

export default function HealthPage() {
    const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
    const [healthMetrics, setHealthMetrics] = useState<HealthMetric | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMetricOpen, setIsMetricOpen] = useState(false);

    // Trend & Preferences State
    const [trendDays, setTrendDays] = useState<30 | 90 | 180>(30);
    const [healthTrend, setHealthTrend] = useState<HealthTrendPoint[]>([]);
    const [calorieTrend, setCalorieTrend] = useState<DailyCalorieSummary[]>([]);
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [isGoalOpen, setIsGoalOpen] = useState(false);
    const [goalCalories, setGoalCalories] = useState("");
    const [goalProtein, setGoalProtein] = useState("");
    const [isTrendLoading, setIsTrendLoading] = useState(false);

    // New Metric State
    const [weight, setWeight] = useState("");
    const [sleep, setSleep] = useState("");
    const [water, setWater] = useState("");

    const today = new Date().toISOString().split("T")[0];

    useEffect(() => {
        loadData();
        loadTrendData(30);
    }, []);

    async function loadData() {
        try {
            const [logs, metrics, prefs] = await Promise.all([
                getFoodLogs(today),
                getHealthMetrics(today),
                getUserPreferences()
            ]);
            setFoodLogs(logs);
            setHealthMetrics(metrics);
            setPreferences(prefs);

            if (metrics) {
                setWeight(metrics.weight?.toString() || "");
                setSleep(metrics.sleep_hours?.toString() || "");
                setWater(metrics.water_intake?.toString() || "");
            }

            if (prefs) {
                setGoalCalories(prefs.calorie_goal.toString());
                setGoalProtein(prefs.protein_goal.toString());
            }
        } catch (error) {
            console.error("Failed to load health data", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function loadTrendData(days: number) {
        setIsTrendLoading(true);
        try {
            const [trend, calories] = await Promise.all([
                getHealthTrend(days),
                getDailyCalorieTotals(days)
            ]);
            setHealthTrend(trend);
            setCalorieTrend(calories);
        } catch (error) {
            console.error("Failed to load trend data", error);
        } finally {
            setIsTrendLoading(false);
        }
    }

    const handleWindowChange = (days: 30 | 90 | 180) => {
        setTrendDays(days);
        loadTrendData(days);
    };

    const handleSaveGoals = async () => {
        try {
            const prefs = await saveUserPreferences({
                calorie_goal: parseInt(goalCalories),
                protein_goal: parseInt(goalProtein)
            });
            if (prefs) {
                setPreferences(prefs);
                toast.success("Health goals updated");
                setIsGoalOpen(false);
            }
        } catch (error) {
            toast.error("Failed to update goals");
        }
    };

    // Manual Food Entry State
    const [isFoodOpen, setIsFoodOpen] = useState(false);
    const [manualFood, setManualFood] = useState({
        food_item: "",
        quantity: "",
        calories: "",
        protein: "",
        carbs: "",
        fats: "",
        meal_type: "snack",
        image_url: ""
    });

    const handleManualFoodLog = async () => {
        if (!manualFood.food_item || !manualFood.calories) {
            toast.error("Food name and calories are required");
            return;
        }

        try {
            await logFood({
                date: today,
                food_item: manualFood.food_item,
                quantity: manualFood.quantity || "1 serving",
                calories: parseFloat(manualFood.calories),
                protein: parseFloat(manualFood.protein) || 0,
                carbs: parseFloat(manualFood.carbs) || 0,
                fats: parseFloat(manualFood.fats) || 0,
                meal_type: manualFood.meal_type,
                image_url: manualFood.image_url || null
            });

            toast.success("Food logged successfully");
            setManualFood({
                food_item: "",
                quantity: "",
                calories: "",
                protein: "",
                carbs: "",
                fats: "",
                meal_type: "snack",
                image_url: ""
            });
            setIsFoodOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to log food");
        }
    };

    const savedMetrics = async () => {
        try {
            await logHealthMetrics({
                date: today,
                weight: parseFloat(weight) || undefined,
                sleep_hours: parseFloat(sleep) || undefined,
                water_intake: parseInt(water) || undefined
            });
            toast.success("Health metrics updated");
            loadData();
            setIsMetricOpen(false);
        } catch (error) {
            toast.error("Failed to update metrics");
        }
    };

    // Calculate totals
    const totalCalories = foodLogs.reduce((acc, log) => acc + (log.calories || 0), 0);
    const totalProtein = foodLogs.reduce((acc, log) => acc + (log.protein || 0), 0);
    const totalCarbs = foodLogs.reduce((acc, log) => acc + (log.carbs || 0), 0);
    const totalFats = foodLogs.reduce((acc, log) => acc + (log.fats || 0), 0);

    const macroData = [
        { name: "Protein", value: totalProtein },
        { name: "Fats", value: totalFats },
        { name: "Carbs", value: totalCarbs },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Health & Nutrition</h1>
                    <p className="text-muted-foreground">Track your biometrics and diet</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isFoodOpen} onOpenChange={setIsFoodOpen}>
                        <DialogTrigger asChild>
                            <Button variant="default">
                                <Plus className="mr-2 h-4 w-4" />
                                Log Food
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Log Food Manually</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Food Name *</Label>
                                    <Input
                                        placeholder="e.g. Grilled Chicken Salad"
                                        value={manualFood.food_item}
                                        onChange={e => setManualFood({ ...manualFood, food_item: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Calories (kcal) *</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={manualFood.calories}
                                            onChange={e => setManualFood({ ...manualFood, calories: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Quantity</Label>
                                        <Input
                                            placeholder="e.g. 1 bowl"
                                            value={manualFood.quantity}
                                            onChange={e => setManualFood({ ...manualFood, quantity: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-2">
                                        <Label>Protein (g)</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={manualFood.protein}
                                            onChange={e => setManualFood({ ...manualFood, protein: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Carbs (g)</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={manualFood.carbs}
                                            onChange={e => setManualFood({ ...manualFood, carbs: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Fats (g)</Label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={manualFood.fats}
                                            onChange={e => setManualFood({ ...manualFood, fats: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Meal Type</Label>
                                    <div className="flex gap-2">
                                        {["breakfast", "lunch", "dinner", "snack"].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setManualFood({ ...manualFood, meal_type: type })}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize border transition-colors ${manualFood.meal_type === type
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-background hover:bg-accent"
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Food Photo (optional)</Label>
                                    <div className="flex items-center gap-3">
                                        <ImageUploadButton
                                            onUploadComplete={(url) => setManualFood({ ...manualFood, image_url: url })}
                                            tags={["health", "food"]}
                                            label="Add Photo"
                                        />
                                        {manualFood.image_url && (
                                            <ImageThumbnails
                                                images={[manualFood.image_url]}
                                                onRemove={() => setManualFood({ ...manualFood, image_url: "" })}
                                            />
                                        )}
                                    </div>
                                </div>
                                <Button onClick={handleManualFoodLog} className="w-full">Save Food Log</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isMetricOpen} onOpenChange={setIsMetricOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Activity className="mr-2 h-4 w-4" />
                                Update Metrics
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Update Daily Metrics</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Weight (kg)</Label>
                                    <Input value={weight} onChange={e => setWeight(e.target.value)} type="number" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sleep (hours)</Label>
                                    <Input value={sleep} onChange={e => setSleep(e.target.value)} type="number" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Water (ml)</Label>
                                    <Input value={water} onChange={e => setWater(e.target.value)} type="number" />
                                </div>
                                <Button onClick={savedMetrics} className="w-full">Save</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Calories</CardTitle>
                        <Flame className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCalories}</div>
                        <p className="text-xs text-muted-foreground">kcal consumed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Protein</CardTitle>
                        <div className="h-4 w-4 text-blue-500 font-bold text-xs flex items-center justify-center border border-blue-500 rounded-full">P</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProtein}g</div>
                        <p className="text-xs text-muted-foreground">consumed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Water</CardTitle>
                        <GlassWater className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{healthMetrics?.water_intake || 0}</div>
                        <p className="text-xs text-muted-foreground">ml consumed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Sleep</CardTitle>
                        <Moon className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{healthMetrics?.sleep_hours || 0}</div>
                        <p className="text-xs text-muted-foreground">hours slept</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Weight</CardTitle>
                        <Scale className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{healthMetrics?.weight || "--"}</div>
                        <p className="text-xs text-muted-foreground">kg</p>
                    </CardContent>
                </Card>
            </div>

            {/* Nutrition & Logs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Macros</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] relative">
                        {totalCalories > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={macroData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {macroData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
                                <Utensils className="h-8 w-8 opacity-20" />
                                <p className="text-sm text-center px-4">Log food to see breakdown</p>
                            </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{totalCalories}</p>
                                <p className="text-xs text-muted-foreground">Total Kcal</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardContent className="pt-0">
                        <div className="flex justify-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-[#3b82f6]" /> Protein ({totalProtein}g)
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-[#ef4444]" /> Fats ({totalFats}g)
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-[#fbbf24]" /> Carbs ({totalCarbs}g)
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Food Log List */}
                <Card className="col-span-1 md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Food Log</CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Use AI or Manual Log
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted/50 rounded-lg animate-pulse" />)}
                            </div>
                        ) : foodLogs.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <p>No meals logged today</p>
                                <p className="text-sm mt-1">Log your first meal to track calories</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {foodLogs.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs uppercase">
                                                {log.meal_type?.[0] || "F"}
                                            </div>
                                            <div>
                                                <p className="font-medium">{log.food_item}</p>
                                                <p className="text-xs text-muted-foreground">{log.quantity} • {log.meal_type}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{log.calories} kcal</p>
                                            <p className="text-xs text-muted-foreground">
                                                P:{log.protein} C:{log.carbs} F:{log.fats}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Calorie Goal Progress */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>🔥 Today&apos;s Calorie Goal</CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary"
                        onClick={() => {
                            setGoalCalories(preferences?.calorie_goal?.toString() || "2000");
                            setGoalProtein(preferences?.protein_goal?.toString() || "150");
                            setIsGoalOpen(true);
                        }}
                    >
                        Edit Goal
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium text-muted-foreground">{totalCalories} kcal consumed</span>
                            <span className="font-bold">Goal: {preferences?.calorie_goal ?? 2000} kcal</span>
                        </div>
                        <Progress value={(totalCalories / (preferences?.calorie_goal ?? 2000)) * 100} className="h-3" />
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">P</div>
                            <div>
                                <p className="text-xs text-muted-foreground">Protein Progress</p>
                                <p className="font-bold">{totalProtein}g / {preferences?.protein_goal ?? 150}g</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-medium text-blue-600">
                                {Math.round((totalProtein / (preferences?.protein_goal ?? 150)) * 100)}%
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Health Trends */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>📈 Health Trends</CardTitle>
                        <div className="flex gap-1">
                            {[30, 90, 180].map((days) => (
                                <button
                                    key={days}
                                    onClick={() => handleWindowChange(days as 30 | 90 | 180)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${trendDays === days
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted hover:bg-accent"
                                        }`}
                                >
                                    {days === 180 ? "6m" : `${days}d`}
                                </button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isTrendLoading ? (
                            <div className="h-[200px] flex items-center justify-center">
                                <Activity className="h-8 w-8 animate-spin text-muted-foreground/20" />
                            </div>
                        ) : healthTrend.length > 0 ? (
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={healthTrend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(d) => format(new Date(d), "MMM d")}
                                            tick={{ fontSize: 10 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis yAxisId="left" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                        />
                                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }} />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="weight"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            name="Weight (kg)"
                                            connectNulls
                                            dot={false}
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="sleep_hours"
                                            stroke="#8b5cf6"
                                            strokeWidth={2}
                                            name="Sleep (hrs)"
                                            connectNulls
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                                Not enough data for trends
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Daily Calories vs Goal */}
                <Card>
                    <CardHeader>
                        <CardTitle>📊 Daily Calories vs Goal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isTrendLoading ? (
                            <div className="h-[200px] flex items-center justify-center">
                                <Flame className="h-8 w-8 animate-spin text-muted-foreground/20" />
                            </div>
                        ) : calorieTrend.length > 0 ? (
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={calorieTrend}>
                                        <defs>
                                            <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(d) => format(new Date(d), "MMM d")}
                                            tick={{ fontSize: 10 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                        />
                                        <ReferenceLine
                                            y={preferences?.calorie_goal ?? 2000}
                                            stroke="#ef4444"
                                            strokeDasharray="4 4"
                                            label={{ value: "Goal", position: "right", fill: "#ef4444", fontSize: 10 }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="totalCalories"
                                            name="Calories"
                                            stroke="#f97316"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorCal)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                                No logs found for this period
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Goal Edit Dialog */}
            <Dialog open={isGoalOpen} onOpenChange={setIsGoalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Nutrition Goals</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Daily Calorie Goal (kcal)</Label>
                            <Input
                                type="number"
                                value={goalCalories}
                                onChange={(e) => setGoalCalories(e.target.value)}
                                placeholder="2000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Daily Protein Goal (g)</Label>
                            <Input
                                type="number"
                                value={goalProtein}
                                onChange={(e) => setGoalProtein(e.target.value)}
                                placeholder="150"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsGoalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveGoals}>Save Goals</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
