"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface ActivityHeatmapProps {
    data: { date: string; count: number }[]; // Array of dates and attempt counts
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
    // Generate last 365 days
    const days = useMemo(() => {
        const today = new Date();
        const dates = [];
        for (let i = 364; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    }, []);

    const getDataForDate = (date: string) => {
        return data.find(d => d.date === date)?.count || 0;
    };

    const getColor = (count: number) => {
        if (count === 0) return "bg-muted/20";
        if (count < 3) return "bg-green-200 dark:bg-green-900";
        if (count < 6) return "bg-green-400 dark:bg-green-700";
        if (count < 10) return "bg-green-600 dark:bg-green-500";
        return "bg-green-800 dark:bg-green-400"; // Intense
    };

    return (
        <div className="w-full overflow-x-auto pb-4">
            <div className="flex flex-col gap-1 min-w-max">
                <div className="grid grid-flow-col grid-rows-7 gap-1">
                    {days.map((date) => {
                        const count = getDataForDate(date);
                        return (
                            <div
                                key={date}
                                className={cn(
                                    "w-3 h-3 rounded-[2px] transition-colors",
                                    getColor(count)
                                )}
                                title={`${date}: ${count} problems`}
                            />
                        );
                    })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
                    <span>Less</span>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}
