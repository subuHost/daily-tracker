"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { refreshBriefingAction } from "@/app/actions/ai";

interface AIDailyBriefingWidgetClientProps {
    initialBriefing: string;
    todayDate: string;
}

export function AIDailyBriefingWidgetClient({ initialBriefing, todayDate }: AIDailyBriefingWidgetClientProps) {
    const [briefingText, setBriefingText] = useState(initialBriefing);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const { briefing } = await refreshBriefingAction();
            setBriefingText(briefing);
        } catch {
            // Keep existing briefing on error
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <Card className="relative overflow-hidden col-span-1 sm:col-span-2 lg:col-span-3">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent pointer-events-none" />

            <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-base font-semibold">Daily Briefing</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                            {isRefreshing ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                                <RefreshCw className="h-3 w-3 mr-1" />
                            )}
                            Refresh
                        </Button>
                        <span className="text-xs text-muted-foreground">{todayDate}</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {briefingText}
                </p>
            </CardContent>
        </Card>
    );
}
