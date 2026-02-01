"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Utensils, Loader2, Target } from "lucide-react";
import Link from "next/link";
import { getFoodLogs, type FoodLog } from "@/lib/db/health";
import { Progress } from "@/components/ui/progress";

export function HealthWidget() {
    const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const today = new Date().toISOString().split("T")[0];

    useEffect(() => {
        async function loadData() {
            try {
                const data = await getFoodLogs(today);
                setFoodLogs(data);
            } catch (error) {
                console.error("Failed to load food logs:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [today]);

    const totalCalories = foodLogs.reduce((acc, log) => acc + (log.calories || 0), 0);
    const totalProtein = foodLogs.reduce((acc, log) => acc + (log.protein || 0), 0);

    // Mock targets (could be fetched from settings later)
    const calTarget = 2000;
    const proteinTarget = 100;

    if (isLoading) {
        return (
            <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Utensils className="h-4 w-4" /> Nutrition
                    </CardTitle>
                </CardHeader>
                <CardContent className="py-6 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />
            <CardHeader className="pb-2 border-b border-orange-500/10">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Utensils className="h-4 w-4 text-orange-500" />
                        Health & Nutrition
                    </div>
                    <Link href="/health" className="text-xs text-primary hover:underline font-normal">
                        View Details
                    </Link>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Calories</span>
                            <span>{Math.round((totalCalories / calTarget) * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <span className="text-lg font-bold">{totalCalories}</span>
                            <span className="text-[10px] text-muted-foreground self-end mb-1">/ {calTarget} kcal</span>
                        </div>
                        <Progress value={(totalCalories / calTarget) * 100} className="h-1.5 bg-orange-100" />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Protein</span>
                            <span>{Math.round((totalProtein / proteinTarget) * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 text-blue-500 font-bold text-[10px] flex items-center justify-center border border-blue-500 rounded-full">P</div>
                            <span className="text-lg font-bold">{totalProtein}g</span>
                            <span className="text-[10px] text-muted-foreground self-end mb-1">/ {proteinTarget}g</span>
                        </div>
                        <Progress value={(totalProtein / proteinTarget) * 100} className="h-1.5 bg-blue-100" />
                    </div>
                </div>

                {foodLogs.length > 0 && (
                    <div className="pt-2 border-t border-orange-500/5">
                        <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Recent Meals</p>
                        <div className="space-y-1">
                            {foodLogs.slice(-2).reverse().map((log) => (
                                <div key={log.id} className="text-xs flex justify-between items-center p-1.5 rounded-md bg-white/50 border border-orange-500/5">
                                    <span className="truncate max-w-[120px]">{log.food_item}</span>
                                    <span className="font-medium text-orange-600">{log.calories} kcal</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
