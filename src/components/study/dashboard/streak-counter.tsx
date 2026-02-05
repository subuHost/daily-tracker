"use client";

import { Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StreakCounter({ streak = 0 }: { streak: number }) {
    return (
        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-200 dark:border-orange-900/50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={cn("p-3 rounded-full", streak > 0 ? "bg-orange-500 text-white animate-pulse" : "bg-muted text-muted-foreground")}>
                    <Flame className="h-6 w-6" />
                </div>
                <div>
                    <div className="text-2xl font-bold">{streak}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Day Streak</div>
                </div>
            </div>
            {streak >= 3 && (
                <div className="text-xs font-medium text-orange-600 dark:text-orange-400 rotate-[-5deg] border border-orange-500/30 rounded px-2 py-1">
                    On Fire! 🔥
                </div>
            )}
        </Card>
    );
}
