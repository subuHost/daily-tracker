"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    CheckCircle2,
    Circle,
    Calendar,
    Flag,
    ClipboardList,
    Loader2,
} from "lucide-react";
import { formatShortDate } from "@/lib/utils";
import { getTasks, toggleTaskComplete, deleteTask, type Task as DBTask } from "@/lib/db";
import { toast } from "sonner";
import { SwipeableListItem } from "@/components/ui/swipeable-list-item";
import { useHaptic } from "@/hooks/use-haptic";

interface Task {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    dueDate?: string;
    priority: "low" | "medium" | "high";
    project?: string;
}

export default function TasksPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const haptic = useHaptic();

    // Fetch tasks on mount
    useEffect(() => {
        async function loadTasks() {
            try {
                const dbTasks = await getTasks();
                const formattedTasks = dbTasks.map((t) => ({
                    id: t.id,
                    title: t.title,
                    description: t.description || undefined,
                    completed: t.completed,
                    dueDate: t.due_date || undefined,
                    priority: t.priority,
                    project: undefined,
                }));
                setTasks(formattedTasks);
            } catch (error) {
                console.error("Failed to load tasks:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadTasks();
    }, []);

    const filteredTasks = tasks.filter((task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const incompleteTasks = filteredTasks.filter((t) => !t.completed);
    const completedTasks = filteredTasks.filter((t) => t.completed);

    const toggleTask = async (id: string) => {
        try {
            await toggleTaskComplete(id);
            setTasks(tasks.map((t) =>
                t.id === id ? { ...t, completed: !t.completed } : t
            ));
            haptic.triggerSuccess();
        } catch (error) {
            console.error("Failed to toggle task:", error);
            toast.error("Failed to update task");
        }
    };

    const handleDeleteTask = async (id: string) => {
        try {
            await deleteTask(id);
            setTasks(tasks.filter(t => t.id !== id));
            haptic.triggerImpact();
            toast.success("Task deleted");
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete task");
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high": return "text-red-500";
            case "medium": return "text-amber-500";
            default: return "text-green-500";
        }
    };

    const TaskCard = ({ task }: { task: Task }) => (
        <SwipeableListItem
            onDelete={() => handleDeleteTask(task.id)}
            onComplete={() => toggleTask(task.id)}
            showComplete={!task.completed}
        >
            <Card
                className={`transition-colors ${task.completed ? "opacity-60" : ""}`}
                onClick={() => toggleTask(task.id)}
            >
                <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                            {task.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                                <Circle className={`h-5 w-5 ${getPriorityColor(task.priority)}`} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm sm:text-base ${task.completed ? "line-through" : ""}`}>
                                {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {task.project && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                        {task.project}
                                    </span>
                                )}
                                {task.dueDate && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatShortDate(task.dueDate)}
                                    </span>
                                )}
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Flag className={`h-3 w-3 ${getPriorityColor(task.priority)}`} />
                                    {task.priority}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </SwipeableListItem>
    );

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
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Tasks</h1>
                    <p className="text-muted-foreground text-sm">
                        {incompleteTasks.length} tasks remaining
                    </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/tasks/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Task
                    </Link>
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Tasks Content */}
            {tasks.length > 0 ? (
                <>
                    {/* Active Tasks */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-medium text-muted-foreground">
                            To Do ({incompleteTasks.length})
                        </h2>
                        {incompleteTasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                        ))}
                        {incompleteTasks.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                <p>All tasks completed!</p>
                            </div>
                        )}
                    </div>

                    {/* Completed Tasks */}
                    {completedTasks.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-sm font-medium text-muted-foreground">
                                Completed ({completedTasks.length})
                            </h2>
                            {completedTasks.map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <ClipboardList className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Start organizing your life by adding your first task.
                    </p>
                    <Button asChild>
                        <Link href="/tasks/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Your First Task
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
