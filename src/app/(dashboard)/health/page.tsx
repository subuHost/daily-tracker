"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Activity, Flame, GlassWater, Moon, Scale, Plus, Utensils, Sparkles } from "lucide-react";
import { getFoodLogs, getHealthMetrics, type FoodLog, type HealthMetric } from "@/lib/db/health";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { logHealthMetrics } from "@/lib/db/health";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#ef4444", "#fbbf24"]; // Protein (Blue), fats (Red), Carbs (Yellow)

export default function HealthPage() {
    const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
    const [healthMetrics, setHealthMetrics] = useState<HealthMetric | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMetricOpen, setIsMetricOpen] = useState(false);

    // New Metric State
    const [weight, setWeight] = useState("");
    const [sleep, setSleep] = useState("");
    const [water, setWater] = useState("");

    const today = new Date().toISOString().split("T")[0];

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [logs, metrics] = await Promise.all([
                getFoodLogs(today),
                getHealthMetrics(today)
            ]);
            setFoodLogs(logs);
            setHealthMetrics(metrics);
            if (metrics) {
                setWeight(metrics.weight?.toString() || "");
                setSleep(metrics.sleep_hours?.toString() || "");
                setWater(metrics.water_intake?.toString() || "");
            }
        } catch (error) {
            console.error("Failed to load health data", error);
        } finally {
            setIsLoading(false);
        }
    }

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                            Use AI Chat to log food
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
                                <p className="text-sm mt-1">Try telling the AI: "I ate a sandwich"</p>
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
        </div>
    );
}
