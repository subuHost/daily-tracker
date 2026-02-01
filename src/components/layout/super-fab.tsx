"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, DollarSign, ListTodo, Check, X, Loader2 } from "lucide-react";
import { useHaptic } from "@/hooks/use-haptic";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { createTransaction } from "@/lib/db/transactions";
import { createTask } from "@/lib/db/tasks";
import { getHabits, toggleHabitToday, type HabitWithStats } from "@/lib/db/habits";

interface RadialAction {
    id: string;
    icon: React.ElementType;
    label: string;
    color: string;
    onClick: () => void;
}

export function SuperFab() {
    const [isOpen, setIsOpen] = useState(false);
    const haptic = useHaptic();
    const router = useRouter();

    // Dialog states
    const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [habitDialogOpen, setHabitDialogOpen] = useState(false);

    // Form states
    const [expenseForm, setExpenseForm] = useState({ amount: "", description: "" });
    const [taskForm, setTaskForm] = useState({ title: "" });
    const [habits, setHabits] = useState<HabitWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const toggleMenu = () => {
        if (!isOpen) {
            haptic.triggerTap();
        } else {
            haptic.triggerTap();
        }
        setIsOpen(!isOpen);
    };

    const handleAction = (action: () => void) => {
        haptic.triggerSuccess();
        action();
        setIsOpen(false);
    };

    // Load habits when habit dialog opens
    useEffect(() => {
        if (habitDialogOpen) {
            loadHabits();
        }
    }, [habitDialogOpen]);

    const loadHabits = async () => {
        try {
            const data = await getHabits();
            setHabits(data);
        } catch (error) {
            console.error("Failed to load habits:", error);
        }
    };

    const handleQuickExpense = async () => {
        if (!expenseForm.amount || !expenseForm.description) {
            toast.error("Please fill in all fields");
            return;
        }
        setIsLoading(true);
        try {
            await createTransaction({
                type: "expense",
                amount: Number(expenseForm.amount),
                description: expenseForm.description,
                date: new Date().toISOString().split("T")[0],
            });
            toast.success("Expense added!", { description: `₹${expenseForm.amount} - ${expenseForm.description}` });
            setExpenseForm({ amount: "", description: "" });
            setExpenseDialogOpen(false);
        } catch (error) {
            console.error("Failed to add expense:", error);
            toast.error("Failed to add expense");
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickTask = async () => {
        if (!taskForm.title) {
            toast.error("Please enter a task title");
            return;
        }
        setIsLoading(true);
        try {
            await createTask({ title: taskForm.title });
            toast.success("Task added!", { description: taskForm.title });
            setTaskForm({ title: "" });
            setTaskDialogOpen(false);
        } catch (error) {
            console.error("Failed to add task:", error);
            toast.error("Failed to add task");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleHabit = async (habitId: string, habitName: string) => {
        try {
            const newState = await toggleHabitToday(habitId);
            setHabits(habits.map(h =>
                h.id === habitId ? { ...h, completedToday: newState } : h
            ));
            toast.success(newState ? "Habit completed!" : "Habit unmarked", { description: habitName });
            haptic.triggerSuccess();
        } catch (error) {
            console.error("Failed to toggle habit:", error);
            toast.error("Failed to update habit");
        }
    };

    const actions: RadialAction[] = [
        {
            id: "expense",
            icon: DollarSign,
            label: "Quick Expense",
            color: "bg-blue-500",
            onClick: () => setExpenseDialogOpen(true),
        },
        {
            id: "task",
            icon: ListTodo,
            label: "Quick Task",
            color: "bg-orange-500",
            onClick: () => setTaskDialogOpen(true),
        },
        {
            id: "habit",
            icon: Check,
            label: "Log Habit",
            color: "bg-green-500",
            onClick: () => setHabitDialogOpen(true),
        },
    ];

    const radius = 80;

    const getItemVariants = (index: number, total: number) => {
        const startAngle = 180;
        const endAngle = 270;
        const step = (endAngle - startAngle) / (total - 1);
        const angle = startAngle + (index * step);
        const radian = (angle * Math.PI) / 180;

        const x = Math.cos(radian) * radius;
        const y = Math.sin(radian) * radius;

        return {
            hidden: { x: 0, y: 0, scale: 0, opacity: 0 },
            visible: {
                x,
                y,
                scale: 1,
                opacity: 1,
                transition: {
                    type: "spring" as const,
                    stiffness: 300,
                    damping: 20,
                    delay: index * 0.05
                }
            },
            exit: { x: 0, y: 0, scale: 0, opacity: 0 }
        };
    };

    return (
        <>
            {/* Backdrop Blur */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-[55] bg-background/80 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Container fixed in bottom right */}
            <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 md:bottom-8 md:right-8 z-[60] flex items-center justify-center">

                {/* Radial Items */}
                <AnimatePresence>
                    {isOpen && actions.map((action, index) => (
                        <motion.div
                            key={action.id}
                            variants={getItemVariants(index, actions.length)}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="absolute"
                        >
                            <button
                                onClick={() => handleAction(action.onClick)}
                                className={cn(
                                    "flex flex-col items-center gap-1 group"
                                )}
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-12 h-12 rounded-full text-white shadow-lg transition-transform active:scale-95",
                                    action.color
                                )}>
                                    <action.icon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-background/90 backdrop-blur-md border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden sm:block">
                                    {action.label}
                                </span>
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Main Trigger Button */}
                <motion.button
                    onClick={toggleMenu}
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className={cn(
                        "flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-colors ring-2 ring-background",
                        isOpen
                            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                >
                    <Plus className="w-7 h-7" />
                    <span className="sr-only">Toggle Menu</span>
                </motion.button>
            </div>

            {/* Quick Expense Dialog */}
            <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Quick Expense</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            type="number"
                            placeholder="Amount (₹)"
                            value={expenseForm.amount}
                            onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                            autoFocus
                        />
                        <Input
                            placeholder="Description (e.g., Coffee, Uber, Groceries)"
                            value={expenseForm.description}
                            onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && handleQuickExpense()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleQuickExpense} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Expense
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Quick Task Dialog */}
            <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Quick Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            placeholder="What needs to be done?"
                            value={taskForm.title}
                            onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && handleQuickTask()}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleQuickTask} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Task
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Habit Toggle Dialog */}
            <Dialog open={habitDialogOpen} onOpenChange={setHabitDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Today&apos;s Habits</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {habits.length > 0 ? (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {habits.map((habit) => (
                                    <button
                                        key={habit.id}
                                        onClick={() => handleToggleHabit(habit.id, habit.name)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                                            habit.completedToday
                                                ? "bg-green-500/10 border-green-500/50"
                                                : "hover:bg-accent/50"
                                        )}
                                    >
                                        <span className="text-2xl">{habit.icon}</span>
                                        <span className="flex-1 text-left font-medium">{habit.name}</span>
                                        <div className={cn(
                                            "p-1 rounded-full",
                                            habit.completedToday
                                                ? "bg-green-500 text-white"
                                                : "bg-muted"
                                        )}>
                                            {habit.completedToday ? (
                                                <Check className="h-4 w-4" />
                                            ) : (
                                                <X className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-4">
                                No habits yet. Create one in the Habits section.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setHabitDialogOpen(false)}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

