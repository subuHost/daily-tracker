"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createHabit } from "@/lib/db";

const habitSchema = z.object({
    name: z.string().min(1, "Habit name is required"),
    icon: z.string().min(1, "Icon is required"),
    targetDays: z.array(z.number()).min(1, "Select at least one day"),
});

type HabitForm = z.infer<typeof habitSchema>;

const iconOptions = [
    { value: "💪", label: "Exercise" },
    { value: "📚", label: "Reading" },
    { value: "🧘", label: "Meditation" },
    { value: "💧", label: "Water" },
    { value: "🏃", label: "Running" },
    { value: "✍️", label: "Writing" },
    { value: "🎯", label: "Focus" },
    { value: "😴", label: "Sleep" },
    { value: "🥗", label: "Healthy Eating" },
    { value: "🎸", label: "Music" },
    { value: "💻", label: "Coding" },
    { value: "✨", label: "Other" },
];

const dayLabels = [
    { value: 0, label: "S", fullLabel: "Sun" },
    { value: 1, label: "M", fullLabel: "Mon" },
    { value: 2, label: "T", fullLabel: "Tue" },
    { value: 3, label: "W", fullLabel: "Wed" },
    { value: 4, label: "T", fullLabel: "Thu" },
    { value: 5, label: "F", fullLabel: "Fri" },
    { value: 6, label: "S", fullLabel: "Sat" },
];

export default function NewHabitPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIcon, setSelectedIcon] = useState("✨");
    const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<HabitForm>({
        resolver: zodResolver(habitSchema),
        defaultValues: {
            icon: "✨",
            targetDays: [0, 1, 2, 3, 4, 5, 6],
        },
    });

    const toggleDay = (day: number) => {
        const newDays = selectedDays.includes(day)
            ? selectedDays.filter(d => d !== day)
            : [...selectedDays, day].sort((a, b) => a - b);
        setSelectedDays(newDays);
        setValue("targetDays", newDays);
    };

    const onSubmit = async (data: HabitForm) => {
        setIsLoading(true);
        try {
            await createHabit(data.name, data.icon, "#8b5cf6", data.targetDays);
            toast.success("Habit created successfully!");
            router.push("/habits");
        } catch (error) {
            console.error("Failed to create habit:", error);
            toast.error("Failed to create habit. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/habits">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Add Habit</h1>
                    <p className="text-muted-foreground">Create a new habit to track</p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Habit Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Exercise, Read, Meditate"
                                {...register("name")}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Choose an Icon</Label>
                            <div className="grid grid-cols-6 gap-2">
                                {iconOptions.map((icon) => (
                                    <button
                                        key={icon.value}
                                        type="button"
                                        onClick={() => {
                                            setSelectedIcon(icon.value);
                                            setValue("icon", icon.value);
                                        }}
                                        className={`p-3 text-2xl rounded-lg border transition-all ${selectedIcon === icon.value
                                            ? "border-primary bg-primary/10 scale-110"
                                            : "border-border hover:bg-accent"
                                            }`}
                                        title={icon.label}
                                    >
                                        {icon.value}
                                    </button>
                                ))}
                            </div>
                            {errors.icon && (
                                <p className="text-sm text-destructive">{errors.icon.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Weekly Schedule</Label>
                            <p className="text-sm text-muted-foreground">
                                Select which days to track this habit
                            </p>
                            <div className="flex gap-2 justify-between">
                                {dayLabels.map((day) => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleDay(day.value)}
                                        className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${selectedDays.includes(day.value)
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground hover:bg-accent"
                                            }`}
                                        title={day.fullLabel}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {selectedDays.length === 7
                                    ? "Every day"
                                    : `${selectedDays.length} days per week`}
                            </p>
                            {errors.targetDays && (
                                <p className="text-sm text-destructive">{errors.targetDays.message}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Habit
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
