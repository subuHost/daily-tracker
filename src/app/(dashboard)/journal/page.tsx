"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Dumbbell,
    Save,
    Loader2,
} from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { toast } from "sonner";
import { getDailyEntry, saveDailyEntry } from "@/lib/db";

interface DailyEntry {
    date: string;
    notes: string;
    studied: string;
    gymDone: boolean;
    gymNotes: string;
    mood: number;
}

export default function JournalPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [entry, setEntry] = useState<DailyEntry>({
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
        studied: "",
        gymDone: false,
        gymNotes: "",
        mood: 3,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Load entry when date changes
    useEffect(() => {
        async function loadEntry() {
            setIsLoading(true);
            try {
                const dateStr = format(currentDate, "yyyy-MM-dd");
                const dbEntry = await getDailyEntry(dateStr);

                if (dbEntry) {
                    setEntry({
                        date: dbEntry.date,
                        notes: dbEntry.notes || "",
                        studied: dbEntry.studied || "",
                        gymDone: dbEntry.gym_done || false,
                        gymNotes: dbEntry.gym_notes || "",
                        mood: dbEntry.mood || 3,
                    });
                } else {
                    // Reset for new entry
                    setEntry({
                        date: dateStr,
                        notes: "",
                        studied: "",
                        gymDone: false,
                        gymNotes: "",
                        mood: 3,
                    });
                }
            } catch (error) {
                console.error("Failed to load entry:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadEntry();
    }, [currentDate]);

    const goToPreviousDay = () => {
        setCurrentDate(subDays(currentDate, 1));
    };

    const goToNextDay = () => {
        const nextDay = addDays(currentDate, 1);
        if (nextDay <= new Date()) {
            setCurrentDate(nextDay);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveDailyEntry({
                date: format(currentDate, "yyyy-MM-dd"),
                notes: entry.notes || null,
                studied: entry.studied || null,
                gym_done: entry.gymDone,
                gym_notes: entry.gymNotes || null,
                mood: entry.mood,
            });
            toast.success("Journal entry saved!");
        } catch (error) {
            console.error("Failed to save entry:", error);
            toast.error("Failed to save entry. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const moods = [
        { value: 1, emoji: "😢", label: "Terrible" },
        { value: 2, emoji: "😔", label: "Bad" },
        { value: 3, emoji: "😐", label: "Okay" },
        { value: 4, emoji: "🙂", label: "Good" },
        { value: 5, emoji: "😄", label: "Great" },
    ];

    const isToday = format(currentDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Daily Journal</h1>
                <p className="text-muted-foreground text-sm">
                    Record your thoughts and activities
                </p>
            </div>

            {/* Date Navigation */}
            <Card>
                <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" size="icon" onClick={goToPreviousDay}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="text-center">
                            <p className="font-semibold text-base sm:text-lg">
                                {format(currentDate, "EEEE")}
                            </p>
                            <p className="text-muted-foreground text-sm">
                                {format(currentDate, "MMMM d, yyyy")}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={goToNextDay}
                            disabled={isToday}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Mood */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">How are you feeling?</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between">
                        {moods.map((mood) => (
                            <button
                                key={mood.value}
                                onClick={() => setEntry({ ...entry, mood: mood.value })}
                                className={`flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-lg transition-all ${entry.mood === mood.value
                                    ? "bg-primary/10 scale-110"
                                    : "hover:bg-accent"
                                    }`}
                            >
                                <span className="text-xl sm:text-2xl">{mood.emoji}</span>
                                <span className="text-[10px] sm:text-xs text-muted-foreground">{mood.label}</span>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Notes */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Notes & Thoughts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <textarea
                        className="w-full min-h-[100px] sm:min-h-[120px] p-3 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                        placeholder="How was your day? What's on your mind?"
                        value={entry.notes}
                        onChange={(e) => setEntry({ ...entry, notes: e.target.value })}
                    />
                </CardContent>
            </Card>

            {/* What I Studied */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        📚 What I Studied/Learned
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <textarea
                        className="w-full min-h-[70px] sm:min-h-[80px] p-3 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                        placeholder="What did you learn today?"
                        value={entry.studied}
                        onChange={(e) => setEntry({ ...entry, studied: e.target.value })}
                    />
                </CardContent>
            </Card>

            {/* Gym */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Dumbbell className="h-4 w-4" />
                        Gym / Workout
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <Label className="text-sm">Did you workout today?</Label>
                        <div className="flex gap-2">
                            <Button
                                variant={entry.gymDone ? "default" : "outline"}
                                size="sm"
                                onClick={() => setEntry({ ...entry, gymDone: true })}
                            >
                                Yes
                            </Button>
                            <Button
                                variant={!entry.gymDone ? "default" : "outline"}
                                size="sm"
                                onClick={() => setEntry({ ...entry, gymDone: false })}
                            >
                                No
                            </Button>
                        </div>
                    </div>
                    {entry.gymDone && (
                        <textarea
                            className="w-full min-h-[70px] sm:min-h-[80px] p-3 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                            placeholder="What exercises did you do?"
                            value={entry.gymNotes}
                            onChange={(e) => setEntry({ ...entry, gymNotes: e.target.value })}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Save Button */}
            <Button onClick={handleSave} className="w-full" size="lg" disabled={isSaving || isLoading}>
                {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Save className="mr-2 h-4 w-4" />
                )}
                {isSaving ? "Saving..." : "Save Entry"}
            </Button>
        </div>
    );
}
