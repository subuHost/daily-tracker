"use client";

import { useState } from "react";
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
} from "lucide-react";
import { formatShortDate } from "@/lib/utils";

interface Task {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    dueDate?: string;
    priority: "low" | "medium" | "high";
    project?: string;
}

const sampleTasks: Task[] = [
    { id: "1", title: "Review monthly expenses", completed: false, dueDate: "2026-01-22", priority: "high", project: "Finance" },
    { id: "2", title: "Update investment portfolio", completed: false, dueDate: "2026-01-25", priority: "medium", project: "Finance" },
    { id: "3", title: "Call insurance company", completed: true, priority: "low", project: "Personal" },
    { id: "4", title: "Plan weekend trip", completed: false, dueDate: "2026-01-24", priority: "medium", project: "Personal" },
    { id: "5", title: "Read 20 pages of book", completed: false, priority: "low", project: "Self Improvement" },
    { id: "6", title: "Prepare presentation", completed: false, dueDate: "2026-01-23", priority: "high", project: "Work" },
    { id: "7", title: "Gym workout", completed: true, priority: "medium", project: "Health" },
];

export default function TasksPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [tasks, setTasks] = useState<Task[]>(sampleTasks);

    const filteredTasks = tasks.filter((task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const incompleteTasks = filteredTasks.filter((t) => !t.completed);
    const completedTasks = filteredTasks.filter((t) => t.completed);

    const toggleTask = (id: string) => {
        setTasks(tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
        ));
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high": return "text-red-500";
            case "medium": return "text-amber-500";
            default: return "text-green-500";
        }
    };

    const TaskCard = ({ task }: { task: Task }) => (
        <Card
            className={`hover:bg-accent/50 transition-colors cursor-pointer ${task.completed ? "opacity-60" : ""
                }`}
            onClick={() => toggleTask(task.id)}
        >
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                        {task.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                            <Circle className={`h-5 w-5 ${getPriorityColor(task.priority)}`} />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`font-medium ${task.completed ? "line-through" : ""}`}>
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
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
                    <p className="text-muted-foreground">
                        {incompleteTasks.length} tasks remaining
                    </p>
                </div>
                <Button asChild>
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
        </div>
    );
}
