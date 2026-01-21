"use client";

import { useState } from "react";
import { Plus, Receipt, CheckSquare, BookOpen } from "lucide-react";
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
    { name: "Note", icon: BookOpen, color: "text-green-500", href: "/journal" },
];

export function QuickAddButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                className="fixed bottom-20 right-4 md:bottom-6 md:right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
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
                                onClick={() => {
                                    setOpen(false);
                                    window.location.href = action.href;
                                }}
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
