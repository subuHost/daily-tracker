"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Flame,
    Check,
    X,
    TrendingUp,
    Target,
    Loader2,
    MoreVertical,
    Edit2,
    Trash2,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getHabits, toggleHabitToday, updateHabit, deleteHabit, type HabitWithStats } from "@/lib/db";
import { toast } from "sonner";
import { format } from "date-fns";
import { SwipeableListItem } from "@/components/ui/swipeable-list-item";
import { useHaptic } from "@/hooks/use-haptic";

export default function HabitsPage() {
    const [habits, setHabits] = useState<HabitWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const haptic = useHaptic();

    // Edit/Delete State
    const [editingHabit, setEditingHabit] = useState<HabitWithStats | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", icon: "✨", targetDays: [0, 1, 2, 3, 4, 5, 6] as number[] });
    const [isActionLoading, setIsActionLoading] = useState(false);

    const dayLabels = [
        { value: 0, label: "S", fullLabel: "Sun" },
        { value: 1, label: "M", fullLabel: "Mon" },
        { value: 2, label: "T", fullLabel: "Tue" },
        { value: 3, label: "W", fullLabel: "Wed" },
        { value: 4, label: "T", fullLabel: "Thu" },
        { value: 5, label: "F", fullLabel: "Fri" },
        { value: 6, label: "S", fullLabel: "Sat" },
    ];

    // Fetch habits on mount
    useEffect(() => {
        async function loadHabits() {
            try {
                const dbHabits = await getHabits();
                setHabits(dbHabits);
            } catch (error) {
                console.error("Failed to load habits:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadHabits();
    }, []);

    const toggleHabit = async (id: string) => {
        try {
            const newState = await toggleHabitToday(id);
            setHabits(habits.map((h) =>
                h.id === id ? {
                    ...h,
                    completedToday: newState,
                    streak: newState ? h.streak + 1 : Math.max(0, h.streak - 1),
                    completedDays: newState ? h.completedDays + 1 : h.completedDays - 1,
                } : h
            ));
            haptic.triggerSuccess();
            toast.success(newState ? "Habit marked complete!" : "Habit unmarked");
        } catch (error) {
            console.error("Failed to toggle habit:", error);
            toast.error("Failed to update habit");
        }
    };

    const handleEditClick = (habit: HabitWithStats) => {
        setEditingHabit(habit);
        const targetDays = Array.isArray(habit.target_days) ? habit.target_days : [0, 1, 2, 3, 4, 5, 6];
        setEditForm({ name: habit.name, icon: habit.icon || "✨", targetDays });
        setIsEditOpen(true);
    };

    const toggleEditDay = (day: number) => {
        const newDays = editForm.targetDays.includes(day)
            ? editForm.targetDays.filter(d => d !== day)
            : [...editForm.targetDays, day].sort((a, b) => a - b);
        setEditForm(prev => ({ ...prev, targetDays: newDays }));
    };

    const handleUpdate = async () => {
        if (!editingHabit) return;
        setIsActionLoading(true);
        try {
            await updateHabit(editingHabit.id, {
                name: editForm.name,
                icon: editForm.icon,
                target_days: editForm.targetDays,
            });

            setHabits(habits.map(h =>
                h.id === editingHabit.id
                    ? { ...h, name: editForm.name, icon: editForm.icon, target_days: editForm.targetDays }
                    : h
            ));

            setIsEditOpen(false);
            toast.success("Habit updated");
        } catch (error) {
            console.error("Update failed:", error);
            toast.error("Failed to update habit");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this habit? All history will be lost.")) return;

        setIsActionLoading(true);
        try {
            await deleteHabit(id);
            setHabits(habits.filter(h => h.id !== id));
            haptic.triggerImpact();
            toast.success("Habit deleted");
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete habit");
        } finally {
            setIsActionLoading(false);
        }
    };

    const completedToday = habits.filter((h) => h.completedToday).length;
    const totalHabits = habits.length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Habits</h1>
                    <p className="text-muted-foreground text-sm">
                        {totalHabits > 0 ? `${completedToday}/${totalHabits} completed today` : "Build better habits"}
                    </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/habits/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Habit
                    </Link>
                </Button>
            </div>

            {habits.length > 0 ? (
                <>
                    {/* Today's Progress */}
                    <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm">Today&apos;s Progress</p>
                                    <p className="text-2xl sm:text-3xl font-bold mt-1">
                                        {totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0}%
                                    </p>
                                </div>
                                <div className="text-4xl sm:text-6xl">{completedToday === totalHabits && totalHabits > 0 ? "🎉" : "💪"}</div>
                            </div>
                            <Progress
                                value={totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0}
                                className="mt-4 h-2 bg-white/20 [&>div]:bg-white"
                            />
                        </CardContent>
                    </Card>

                    {/* Habits List */}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {habits.map((habit) => (
                            <SwipeableListItem
                                key={habit.id}
                                onComplete={() => toggleHabit(habit.id)}
                                onDelete={() => handleDelete(habit.id)}
                                showComplete={true}
                            >
                                <Card
                                    className={`transition-all h-full ${habit.completedToday
                                        ? "bg-green-500/10 border-green-500/50"
                                        : "hover:bg-accent/50"
                                        }`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleHabit(habit.id)}>
                                                <div className="text-2xl sm:text-3xl select-none">{habit.icon}</div>
                                                <div>
                                                    <p className="font-medium text-sm sm:text-base">{habit.name}</p>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Flame className={`h-3 w-3 ${habit.streak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                                                        <span>{habit.streak} day streak</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Toggle Button */}
                                                <div
                                                    onClick={() => toggleHabit(habit.id)}
                                                    className={`p-2 rounded-full cursor-pointer transition-colors ${habit.completedToday
                                                        ? "bg-green-500 text-white"
                                                        : "bg-muted hover:bg-muted/80"
                                                        }`}
                                                >
                                                    {habit.completedToday ? (
                                                        <Check className="h-4 w-4" />
                                                    ) : (
                                                        <X className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </div>

                                                {/* Menu */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEditClick(habit)}>
                                                            <Edit2 className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(habit.id)} className="text-destructive focus:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>

                                        {/* Monthly Heatmap */}
                                        <p className="text-xs text-muted-foreground mt-3 mb-1">Last 12 weeks</p>
                                        <TooltipProvider>
                                            <div className="flex flex-wrap gap-1">
                                                {Array.from({ length: 84 }).map((_, i) => {
                                                    const day = new Date();
                                                    day.setDate(day.getDate() - (83 - i)); // Last 84 days
                                                    const dayStr = day.toISOString().split("T")[0];
                                                    const isCompleted = habit.recentLogs?.includes(dayStr);
                                                    return (
                                                        <Tooltip key={i}>
                                                            <TooltipTrigger asChild>
                                                                <div
                                                                    className={`w-1.5 h-1.5 rounded-sm ${isCompleted ? "bg-green-500" : "bg-muted-foreground/20"}`}
                                                                />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-[10px]">{format(day, "MMM d, yyyy")}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )
                                                })}
                                            </div>
                                        </TooltipProvider>
                                    </CardContent>
                                </Card>
                            </SwipeableListItem>
                        ))}
                    </div>
                </>
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Target className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No habits tracked yet</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                        Build lasting habits by tracking them daily.
                    </p>
                    <Button asChild>
                        <Link href="/habits/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Your First Habit
                        </Link>
                    </Button>
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Habit</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Habit Name</Label>
                            <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Icon (Emoji)</Label>
                            <Input
                                value={editForm.icon}
                                onChange={(e) => setEditForm(prev => ({ ...prev, icon: e.target.value }))}
                                maxLength={2}
                                className="w-16 text-center text-2xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Weekly Schedule</Label>
                            <div className="flex gap-1.5 justify-between">
                                {dayLabels.map((day) => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleEditDay(day.value)}
                                        className={`w-9 h-9 rounded-full text-sm font-medium transition-all ${editForm.targetDays.includes(day.value)
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
                                {editForm.targetDays.length === 7
                                    ? "Every day"
                                    : `${editForm.targetDays.length} days per week`}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isActionLoading}>Cancel</Button>
                        <Button onClick={handleUpdate} disabled={isActionLoading}>
                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
