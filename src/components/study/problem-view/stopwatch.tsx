"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface StopwatchProps {
    onTimeUpdate: (seconds: number) => void;
}

export function Stopwatch({ onTimeUpdate }: StopwatchProps) {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive) {
            interval = setInterval(() => {
                setSeconds(prev => {
                    const next = prev + 1;
                    onTimeUpdate(next);
                    return next;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive, onTimeUpdate]);

    const toggle = () => setIsActive(!isActive);
    const reset = () => {
        setIsActive(false);
        setSeconds(0);
        onTimeUpdate(0);
    };

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Color change functionality (Time pressure)
    const isOverLimit = seconds > 1800; // 30 mins

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-colors",
            isOverLimit ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400" : "bg-background"
        )}>
            <div className="font-mono text-lg font-medium min-w-[3.5rem] text-center">
                {formatTime(seconds)}
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-muted"
                onClick={toggle}
            >
                {isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-muted"
                onClick={reset}
                disabled={isActive}
            >
                <RotateCcw className="h-3 w-3" />
            </Button>
        </div>
    );
}
