"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, BarChart3, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getHabits, type HabitWithStats } from "@/lib/db/habits";

export function HabitsWidget() {
    const [habits, setHabits] = useState<HabitWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadHabits() {
            try {
                const data = await getHabits();
                setHabits(data);
            } catch (error) {
                console.error("Failed to load habits:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadHabits();
    }, []);

    // Get most important stats
    const bestStreak = habits.reduce((best, h) => (h.streak > best.streak ? h : best), habits[0]);
    const completedToday = habits.filter(h => h.completedToday).length;
    const totalHabits = habits.length;

    if (isLoading) {
        return (
            <Card className="relative overflow-hidden row-span-1">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none" />
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" /> Habits
                    </CardTitle>
                </CardHeader>
                <CardContent className="py-6 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (habits.length === 0) {
        return (
            <Card className="relative overflow-hidden row-span-1">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none" />
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" /> Habits
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="py-4 text-center">
                        <p className="text-sm text-muted-foreground mb-3">
                            Start building good habits
                        </p>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/habits/new">
                                <Plus className="h-4 w-4 mr-1" />
                                Create Habit
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="relative overflow-hidden row-span-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none" />
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" /> Habits
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Today's Progress */}
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm">Today</span>
                    <span className={cn(
                        "text-sm font-medium",
                        completedToday === totalHabits ? "text-green-500" : ""
                    )}>
                        {completedToday}/{totalHabits} done
                    </span>
                </div>

                {/* Best Streak */}
                {bestStreak && bestStreak.streak > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">{bestStreak.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {bestStreak.streak} day streak
                            </p>
                        </div>
                        <span className="text-xl">{bestStreak.icon}</span>
                    </div>
                )}

                {/* Quick Habit Overview */}
                <div className="flex gap-1.5 flex-wrap">
                    {habits.slice(0, 5).map((habit) => (
                        <div
                            key={habit.id}
                            className={cn(
                                "w-8 h-8 flex items-center justify-center rounded-full text-sm",
                                habit.completedToday
                                    ? "bg-green-500/20 ring-2 ring-green-500"
                                    : "bg-muted"
                            )}
                            title={`${habit.name}${habit.completedToday ? " ✓" : ""}`}
                        >
                            {habit.icon}
                        </div>
                    ))}
                    {habits.length > 5 && (
                        <Link
                            href="/habits"
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-xs hover:bg-accent"
                        >
                            +{habits.length - 5}
                        </Link>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
