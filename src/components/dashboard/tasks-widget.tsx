"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, AlertCircle, Plus, Loader2 } from "lucide-react";
import { formatShortDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getTasks, type Task } from "@/lib/db/tasks";
import { getBills, type Bill } from "@/lib/db/bills";

export function TasksWidget() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [tasksData, billsData] = await Promise.all([
                    getTasks(false), // Only incomplete tasks
                    getBills(),
                ]);
                setTasks(tasksData);
                setBills(billsData);
            } catch (error) {
                console.error("Failed to load tasks/bills:", error);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    const incompleteTasks = tasks.slice(0, 3);
    const upcomingBills = bills.filter((b) => !b.is_paid).slice(0, 2);
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

    // Calculate next due date for bill
    const getNextDueDate = (dueDay: number) => {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        if (dueDay >= currentDay) {
            return new Date(currentYear, currentMonth, dueDay);
        } else {
            return new Date(currentYear, currentMonth + 1, dueDay);
        }
    };

    if (isLoading) {
        return (
            <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Today&apos;s Tasks & Bills
                    </CardTitle>
                </CardHeader>
                <CardContent className="py-6 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
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
                                {upcomingBills.map((bill) => {
                                    const nextDue = getNextDueDate(bill.due_date);
                                    return (
                                        <div key={bill.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                                <span className="text-sm">{bill.name}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {formatShortDate(nextDue.toISOString().split("T")[0])}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-4 text-center">
                        <p className="text-sm text-muted-foreground mb-3">
                            No tasks or bills yet
                        </p>
                        <div className="flex justify-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/tasks/new">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Task
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/finance/bills/new">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Bill
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

