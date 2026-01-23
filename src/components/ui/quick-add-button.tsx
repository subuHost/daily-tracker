"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Receipt, CheckSquare, BookOpen, Target, TrendingUp, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const quickActions = [
    { name: "Expense", icon: Receipt, color: "text-red-500", href: "/finance/expenses/new" },
    { name: "Task", icon: CheckSquare, color: "text-blue-500", href: "/tasks/new" },
    { name: "New Bill", icon: Receipt, color: "text-orange-500", href: "/finance/bills/new" },
    { name: "Log Habit", icon: Target, color: "text-purple-500", href: "/habits" },
    { name: "Asset", icon: TrendingUp, color: "text-cyan-500", href: "/finance/investments/new" },
    { name: "Set Budget", icon: PiggyBank, color: "text-emerald-500", href: "/finance/budget" },
    { name: "Note", icon: BookOpen, color: "text-green-500", href: "/journal" },
];

export function QuickAddButton() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const handleAction = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 md:bottom-8 md:right-8 h-14 w-14 rounded-full shadow-lg z-[60] bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 ring-2 ring-background"
                size="icon"
            >
                <Plus className="h-6 w-6" />
                <span className="sr-only">Quick Add</span>
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[320px]">
                    <DialogHeader>
                        <DialogTitle>Quick Add</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-4 py-4">
                        {quickActions.map((action) => (
                            <button
                                key={action.name}
                                onClick={() => handleAction(action.href)}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:bg-accent transition-colors"
                            >
                                <div className={cn("p-3 rounded-full bg-muted", action.color)}>
                                    <action.icon className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium">{action.name}</span>
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
