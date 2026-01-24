"use client";

import { useState, useEffect, useRef } from "react";
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
    Mic,
    Square,
    Play,
    Image as ImageIcon,
    Upload,
    X,
    Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format, addDays, subDays } from "date-fns";
import { toast } from "sonner";
import { getDailyEntry, saveDailyEntry, uploadGalleryFile } from "@/lib/db";
import Image from "next/image";

interface DailyEntry {
    date: string;
    notes: string;
    studied: string;
    gymDone: boolean;
    gymNotes: string;
    mood: number;
    images: string[];
    voiceNotes: string[];
}

export default function JournalPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Initialize date from URL or default to today
    const [currentDate, setCurrentDate] = useState(() => {
        const dateParam = searchParams.get("date");
        if (dateParam) {
            const date = new Date(dateParam);
            if (!isNaN(date.getTime())) return date;
        }
        return new Date();
    });

    const [entry, setEntry] = useState<DailyEntry>({
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
        studied: "",
        gymDone: false,
        gymNotes: "",
        mood: 3,
        images: [],
        voiceNotes: [],
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

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
                        images: dbEntry.images || [],
                        voiceNotes: dbEntry.voice_notes || [],
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
                        images: [],
                        voiceNotes: [],
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
                images: entry.images,
                voice_notes: entry.voiceNotes,
            });
            toast.success("Journal entry saved!");
        } catch (error) {
            console.error("Failed to save entry:", error);
            toast.error("Failed to save entry. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });

                try {
                    toast.info("Uploading voice note...");
                    const item = await uploadGalleryFile(file, "Voice Note", ["voice-note", "journal"]);
                    setEntry(prev => ({ ...prev, voiceNotes: [...prev.voiceNotes, item.file_url] }));
                    toast.success("Voice note saved");
                } catch (err: any) {
                    console.error("Failed to upload voice note", err);
                    toast.error(`Failed to save voice note: ${err.message || "Unknown error"}`);
                }

                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err: any) {
            console.error("Failed to access microphone", err);
            toast.error(`Microphone access denied: ${err.message || "Unknown error"}`);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleImageUpload = async (e: any) => {
        if (e.target.files) {
            const files = Array.from(e.target.files as FileList);
            for (const file of files) {
                try {
                    toast.info(`Uploading ${file.name}...`);
                    const item = await uploadGalleryFile(file, "Journal Image", ["journal"]);
                    setEntry(prev => ({ ...prev, images: [...prev.images, item.file_url] }));
                    toast.success("Image uploaded");
                } catch (err: any) {
                    console.error("Failed to upload image", err);
                    toast.error(`Failed to upload image: ${err.message || "Unknown error"}`);
                }
            }
        }
    };

    const removeImage = (index: number) => {
        setEntry(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const removeVoiceNote = (index: number) => {
        setEntry(prev => ({
            ...prev,
            voiceNotes: prev.voiceNotes.filter((_, i) => i !== index)
        }));
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Daily Journal</h1>
                    <p className="text-muted-foreground text-sm">
                        Record your thoughts and activities
                    </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/journal/history">
                        View History
                    </Link>
                </Button>
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

            {/* Attachments */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Attachments & Media
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Voice Notes */}
                    <div className="space-y-3">
                        <Label className="text-sm">Voice Notes</Label>
                        <div className="flex items-center gap-4">
                            <Button
                                variant={isRecording ? "destructive" : "outline"}
                                className="flex items-center gap-2"
                                onClick={isRecording ? stopRecording : startRecording}
                            >
                                {isRecording ? (
                                    <>
                                        <Square className="h-4 w-4 fill-current" />
                                        Stop Recording
                                    </>
                                ) : (
                                    <>
                                        <Mic className="h-4 w-4" />
                                        Record Note
                                    </>
                                )}
                            </Button>
                            {isRecording && (
                                <span className="text-sm text-destructive animate-pulse">
                                    Recording...
                                </span>
                            )}
                        </div>

                        {entry.voiceNotes.length > 0 && (
                            <div className="space-y-2">
                                {entry.voiceNotes.map((url, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                                        <audio controls src={url} className="h-8 w-full max-w-[200px]" />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeVoiceNote(index)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-4 space-y-3">
                        <Label className="text-sm">Images</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {entry.images.map((url, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border group">
                                    <Image
                                        src={url}
                                        alt="Journal attachment"
                                        fill
                                        className="object-cover"
                                    />
                                    <button
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors">
                                <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                                <span className="text-xs text-muted-foreground">Add Image</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </label>
                        </div>
                    </div>
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
