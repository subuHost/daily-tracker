"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, TrendingUp } from "lucide-react";

interface HabitsWidgetProps {
    gymStreak?: number;
    gymDays?: number;
    readingStreak?: number;
    meditationStreak?: number;
}

export function HabitsWidget({
    gymStreak = 12,
    gymDays = 18,
    readingStreak = 5,
    meditationStreak = 3
}: HabitsWidgetProps) {
    const habits = [
        { name: "Gym", streak: gymStreak, icon: "🏋️", color: "from-orange-500" },
        { name: "Reading", streak: readingStreak, icon: "📚", color: "from-blue-500" },
        { name: "Meditation", streak: meditationStreak, icon: "🧘", color: "from-purple-500" },
    ];

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
                <div className="space-y-4">
                    {/* Main streak */}
                    <div className="flex items-center gap-4">
                        <div className="text-4xl">🔥</div>
                        <div>
                            <div className="text-3xl font-bold">{gymStreak}</div>
                            <p className="text-sm text-muted-foreground">day gym streak</p>
                        </div>
                    </div>

                    {/* Other habits */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                        {habits.map((habit) => (
                            <div key={habit.name} className="text-center">
                                <div className="text-xl mb-1">{habit.icon}</div>
                                <div className="text-lg font-semibold">{habit.streak}</div>
                                <p className="text-[10px] text-muted-foreground">{habit.name}</p>
                            </div>
                        ))}
                    </div>

                    {/* Monthly stats */}
                    <div className="flex items-center gap-2 pt-2 border-t text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span>{gymDays} gym days this month</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
