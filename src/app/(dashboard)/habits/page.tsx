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

const sampleHabits: Habit[] = [
    { id: "1", name: "Gym", icon: "🏋️", streak: 12, completedToday: false, completedDays: 18, totalDays: 21 },
    { id: "2", name: "Reading", icon: "📚", streak: 5, completedToday: true, completedDays: 15, totalDays: 21 },
    { id: "3", name: "Meditation", icon: "🧘", streak: 3, completedToday: false, completedDays: 10, totalDays: 21 },
    { id: "4", name: "Water Intake", icon: "💧", streak: 8, completedToday: true, completedDays: 19, totalDays: 21 },
    { id: "5", name: "No Sugar", icon: "🚫", streak: 2, completedToday: false, completedDays: 8, totalDays: 21 },
    { id: "6", name: "Early Wake", icon: "🌅", streak: 7, completedToday: true, completedDays: 14, totalDays: 21 },
];

// Generate calendar heatmap data
const generateHeatmapData = () => {
    const data = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        data.push({
            date: date.toISOString().split("T")[0],
            completed: Math.random() > 0.3,
        });
    }
    return data;
};

export default function HabitsPage() {
    const [habits, setHabits] = useState<Habit[]>(sampleHabits);
    const heatmapData = generateHeatmapData();

    const toggleHabit = (id: string) => {
        setHabits(habits.map((h) =>
            h.id === id ? { ...h, completedToday: !h.completedToday } : h
        ));
    };

    const completedToday = habits.filter((h) => h.completedToday).length;
    const totalHabits = habits.length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Habits</h1>
                    <p className="text-muted-foreground">
                        {completedToday}/{totalHabits} completed today
                    </p>
                </div>
                <Button asChild>
                    <Link href="/habits/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Habit
                    </Link>
                </Button>
            </div>

            {/* Today's Progress */}
            <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Today&apos;s Progress</p>
                            <p className="text-3xl font-bold mt-1">
                                {Math.round((completedToday / totalHabits) * 100)}%
                            </p>
                        </div>
                        <div className="text-6xl">{completedToday === totalHabits ? "🎉" : "💪"}</div>
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
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
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
                                    <div className="text-3xl">{habit.icon}</div>
                                    <div>
                                        <p className="font-medium">{habit.name}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Flame className="h-3 w-3 text-orange-500" />
                                            <span>{habit.streak} day streak</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right text-sm text-muted-foreground">
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
                                            <Check className="h-5 w-5" />
                                        ) : (
                                            <X className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
