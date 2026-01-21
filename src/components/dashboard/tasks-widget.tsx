"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, AlertCircle, Plus } from "lucide-react";
import { formatShortDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

export function TasksWidget({ tasks = [], bills = [] }: TasksWidgetProps) {
    const incompleteTasks = tasks.filter((t) => !t.completed).slice(0, 3);
    const upcomingBills = bills.filter((b) => !b.isPaid).slice(0, 2);
    const hasContent = incompleteTasks.length > 0 || upcomingBills.length > 0;

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
                {hasContent ? (
                    <>
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
                    </>
                ) : (
                    <div className="py-4 text-center">
                        <p className="text-sm text-muted-foreground mb-3">
                            No tasks or bills yet
                        </p>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/tasks">
                                <Plus className="h-4 w-4 mr-1" />
                                Add Task
                            </Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
