"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, BookOpen, Calendar, Loader2 } from "lucide-react";
import { getAllEntries, type DailyEntry } from "@/lib/db";
import { format } from "date-fns";

export default function JournalHistoryPage() {
    const [entries, setEntries] = useState<DailyEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadEntries() {
            try {
                const data = await getAllEntries();
                setEntries(data);
            } catch (error) {
                console.error("Failed to load history:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadEntries();
    }, []);

    const moods = [
        { value: 1, emoji: "😢", label: "Terrible" },
        { value: 2, emoji: "😔", label: "Bad" },
        { value: 3, emoji: "😐", label: "Okay" },
        { value: 4, emoji: "🙂", label: "Good" },
        { value: 5, emoji: "😄", label: "Great" },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/journal">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Journal History</h1>
                    <p className="text-muted-foreground text-sm">
                        {entries.length} entrie(s) recorded
                    </p>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {entries.length > 0 ? (
                    entries.map((entry) => (
                        <Card key={entry.id} className="hover:bg-accent/50 transition-colors">
                            <Link href={`/journal?date=${entry.date}`}>
                                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-start">
                                    {/* Date & Mood */}
                                    <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-2 min-w-[120px]">
                                        <div className="text-center sm:text-left">
                                            <p className="font-bold text-lg">{format(new Date(entry.date), "MMM d")}</p>
                                            <p className="text-sm text-muted-foreground">{format(new Date(entry.date), "yyyy")}</p>
                                        </div>
                                        {entry.mood && (
                                            <div className="text-2xl sm:text-3xl" title={moods.find(m => m.value === entry.mood)?.label}>
                                                {moods.find(m => m.value === entry.mood)?.emoji}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Preview */}
                                    <div className="flex-1 space-y-2">
                                        {entry.notes ? (
                                            <p className="line-clamp-2 text-sm sm:text-base">
                                                {entry.notes}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">No notes written</p>
                                        )}

                                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                            {entry.gym_done && (
                                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                                    💪 Workout
                                                </span>
                                            )}
                                            {entry.studied && (
                                                <span className="bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                                                    📚 Studied
                                                </span>
                                            )}
                                            {entry.images && entry.images.length > 0 && (
                                                <span className="bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                                                    📷 {entry.images.length} Image{entry.images.length > 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {entry.voice_notes && entry.voice_notes.length > 0 && (
                                                <span className="bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                                                    🎤 {entry.voice_notes.length} Voice Note{entry.voice_notes.length > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-20 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No journal entries yet.</p>
                        <Button variant="link" asChild className="mt-2">
                            <Link href="/journal">Write your first entry</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
