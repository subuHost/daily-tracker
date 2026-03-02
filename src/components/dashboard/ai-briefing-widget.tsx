import { generateDailyBriefing } from "@/app/actions/ai";
import { AIDailyBriefingWidgetClient } from "./ai-briefing-widget-client";

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
        <AIDailyBriefingWidgetClient
            initialBriefing={briefingText}
            todayDate={today}
        />
    );
}
