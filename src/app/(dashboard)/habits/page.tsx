"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Plus,
    Flame,
    Check,
    X,
    TrendingUp,
    Target,
} from "lucide-react";

interface Habit {
    id: string;
    name: string;
    icon: string;
    streak: number;
    completedToday: boolean;
    completedDays: number;
    totalDays: number;
}

export default function HabitsPage() {
    const [habits, setHabits] = useState<Habit[]>([]);

    const toggleHabit = (id: string) => {
        setHabits(habits.map((h) =>
            h.id === id ? { ...h, completedToday: !h.completedToday } : h
        ));
    };

    const completedToday = habits.filter((h) => h.completedToday).length;
    const totalHabits = habits.length;

    // Generate calendar heatmap data (empty for new users)
    const generateHeatmapData = () => {
        const data = [];
        const today = new Date();
        for (let i = 27; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            data.push({
                date: date.toISOString().split("T")[0],
                completed: false,
            });
        }
        return data;
    };

    const heatmapData = generateHeatmapData();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Habits</h1>
                    <p className="text-muted-foreground text-sm">
                        {totalHabits > 0 ? `${completedToday}/${totalHabits} completed today` : "Build better habits"}
                    </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/habits/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Habit
                    </Link>
                </Button>
            </div>

            {habits.length > 0 ? (
                <>
                    {/* Today's Progress */}
                    <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm">Today&apos;s Progress</p>
                                    <p className="text-2xl sm:text-3xl font-bold mt-1">
                                        {Math.round((completedToday / totalHabits) * 100)}%
                                    </p>
                                </div>
                                <div className="text-4xl sm:text-6xl">{completedToday === totalHabits ? "🎉" : "💪"}</div>
                            </div>
                            <Progress
                                value={(completedToday / totalHabits) * 100}
                                className="mt-4 h-2 bg-white/20 [&>div]:bg-white"
                            />
                        </CardContent>
                    </Card>

                    {/* Calendar Heatmap */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Last 28 Days
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-7 gap-1">
                                {heatmapData.map((day, index) => (
                                    <div
                                        key={index}
                                        className={`aspect-square rounded-sm ${day.completed
                                            ? "bg-green-500"
                                            : "bg-muted"
                                            }`}
                                        title={day.date}
                                    />
                                ))}
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                <span>4 weeks ago</span>
                                <span>Today</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Habits List */}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                        {habits.map((habit) => (
                            <Card
                                key={habit.id}
                                className={`cursor-pointer transition-all ${habit.completedToday
                                    ? "bg-green-500/10 border-green-500/50"
                                    : "hover:bg-accent/50"
                                    }`}
                                onClick={() => toggleHabit(habit.id)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="text-2xl sm:text-3xl">{habit.icon}</div>
                                            <div>
                                                <p className="font-medium text-sm sm:text-base">{habit.name}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Flame className="h-3 w-3 text-orange-500" />
                                                    <span>{habit.streak} day streak</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="text-right text-sm text-muted-foreground hidden sm:block">
                                                <p>{Math.round((habit.completedDays / habit.totalDays) * 100)}%</p>
                                                <p className="text-xs">{habit.completedDays}/{habit.totalDays}</p>
                                            </div>
                                            <div
                                                className={`p-2 rounded-full ${habit.completedToday
                                                    ? "bg-green-500 text-white"
                                                    : "bg-muted"
                                                    }`}
                                            >
                                                {habit.completedToday ? (
                                                    <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                                                ) : (
                                                    <X className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Target className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No habits tracked yet</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                        Build lasting habits by tracking them daily. Start with one habit and grow from there.
                    </p>
                    <Button asChild>
                        <Link href="/habits/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Your First Habit
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
