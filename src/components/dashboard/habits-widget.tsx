"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Habit {
    name: string;
    streak: number;
    icon: string;
}

interface HabitsWidgetProps {
    habits?: Habit[];
    gymDays?: number;
}

export function HabitsWidget({ habits = [], gymDays = 0 }: HabitsWidgetProps) {
    const hasHabits = habits.length > 0;
    const mainStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;

    return (
        <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Habit Streaks
                </CardTitle>
                <div className="p-2 rounded-lg bg-orange-500/10">
                    <Flame className="h-4 w-4 text-orange-500" />
                </div>
            </CardHeader>
            <CardContent>
                {hasHabits ? (
                    <div className="space-y-4">
                        {/* Main streak */}
                        <div className="flex items-center gap-4">
                            <div className="text-4xl">🔥</div>
                            <div>
                                <div className="text-3xl font-bold">{mainStreak}</div>
                                <p className="text-sm text-muted-foreground">day best streak</p>
                            </div>
                        </div>

                        {/* Other habits */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                            {habits.slice(0, 3).map((habit) => (
                                <div key={habit.name} className="text-center">
                                    <div className="text-xl mb-1">{habit.icon}</div>
                                    <div className="text-lg font-semibold">{habit.streak}</div>
                                    <p className="text-[10px] text-muted-foreground">{habit.name}</p>
                                </div>
                            ))}
                        </div>

                        {/* Monthly stats */}
                        {gymDays > 0 && (
                            <div className="flex items-center gap-2 pt-2 border-t text-sm text-muted-foreground">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                <span>{gymDays} workout days this month</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-4 text-center">
                        <div className="text-4xl mb-2 opacity-30">🔥</div>
                        <p className="text-sm text-muted-foreground mb-3">
                            Start tracking your habits
                        </p>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/habits">
                                <Plus className="h-4 w-4 mr-1" />
                                Add Habit
                            </Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
