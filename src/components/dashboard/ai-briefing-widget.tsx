import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { generateDailyBriefing } from "@/app/actions/ai";

export async function AIDailyBriefingWidget() {
    let briefingText: string;

    try {
        const { briefing } = await generateDailyBriefing();
        briefingText = briefing;
    } catch {
        briefingText = "No briefing available today.";
    }

    const today = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

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
                    <span className="text-xs text-muted-foreground">{today}</span>
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
