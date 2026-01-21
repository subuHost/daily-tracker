"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { formatShortDate } from "@/lib/utils";

interface Task {
    id: string;
    title: string;
    completed: boolean;
    dueDate?: string;
    priority: "low" | "medium" | "high";
}

interface Bill {
    id: string;
    name: string;
    amount: number;
    dueDate: string;
    isPaid: boolean;
}

interface TasksWidgetProps {
    tasks?: Task[];
    bills?: Bill[];
}

const defaultTasks: Task[] = [
    { id: "1", title: "Review monthly expenses", completed: false, priority: "high" },
    { id: "2", title: "Update investment portfolio", completed: false, priority: "medium" },
    { id: "3", title: "Call insurance company", completed: true, priority: "low" },
];

const defaultBills: Bill[] = [
    { id: "1", name: "Electricity Bill", amount: 2500, dueDate: "2026-01-25", isPaid: false },
    { id: "2", name: "Internet", amount: 999, dueDate: "2026-01-28", isPaid: false },
];

export function TasksWidget({ tasks = defaultTasks, bills = defaultBills }: TasksWidgetProps) {
    const incompleteTasks = tasks.filter((t) => !t.completed).slice(0, 3);
    const upcomingBills = bills.filter((b) => !b.isPaid).slice(0, 2);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "text-red-500";
            case "medium":
                return "text-yellow-500";
            default:
                return "text-green-500";
        }
    };

    return (
        <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Today&apos;s Tasks & Bills
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Tasks */}
                <div className="space-y-2">
                    {incompleteTasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-3">
                            <Circle className={`h-4 w-4 ${getPriorityColor(task.priority)}`} />
                            <span className="text-sm flex-1 truncate">{task.title}</span>
                        </div>
                    ))}
                    {incompleteTasks.length === 0 && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm">All tasks completed!</span>
                        </div>
                    )}
                </div>

                {/* Bills */}
                {upcomingBills.length > 0 && (
                    <div className="pt-2 border-t space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">Upcoming Bills</p>
                        {upcomingBills.map((bill) => (
                            <div key={bill.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                    <span className="text-sm">{bill.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {formatShortDate(bill.dueDate)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
