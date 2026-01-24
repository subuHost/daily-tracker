"use client";

import { useState, useEffect } from "react";
import { BudgetWidget } from "@/components/dashboard/budget-widget";
import { TasksWidget } from "@/components/dashboard/tasks-widget";
import { ExpensesWidget } from "@/components/dashboard/expenses-widget";
import { HabitsWidget } from "@/components/dashboard/habits-widget";
import { NetWorthWidget } from "@/components/dashboard/net-worth-widget";
import { QuickLinksWidget } from "@/components/dashboard/quick-links-widget";
import { getGreeting } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { getCurrentBudget, getMonthlySpent, getTransactions } from "@/lib/db";
import { EventsWidget } from "@/components/widgets/events-widget";

interface Transaction {
    id: string;
    description: string;
    amount: number;
    date: string;
    type: "expense" | "income";
    category: string;
}

export default function DashboardPage() {
    const greeting = getGreeting();
    const [isLoading, setIsLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [budget, setBudget] = useState<number | undefined>(undefined);
    const [spent, setSpent] = useState<number>(0);

    useEffect(() => {
        async function loadDashboardData() {
            try {
                // Fetch recent transactions
                const txns = await getTransactions(10);
                const formattedTxns = txns.map((t) => ({
                    id: t.id,
                    description: t.description,
                    amount: Number(t.amount),
                    date: t.date,
                    type: t.type as "expense" | "income",
                    category: t.category_name || "Uncategorized",
                }));
                setTransactions(formattedTxns);

                // Fetch budget info
                const currentBudget = await getCurrentBudget();
                if (currentBudget) {
                    setBudget(Number(currentBudget.amount));
                }

                // Fetch monthly spent
                const monthlySpent = await getMonthlySpent();
                setSpent(monthlySpent);
            } catch (error) {
                console.error("Failed to load dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadDashboardData();
    }, []);

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
            <div className="hidden md:block">
                <h1 className="text-2xl font-bold tracking-tight">{greeting}</h1>
                <p className="text-muted-foreground">
                    Here&apos;s what&apos;s happening with your life today.
                </p>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden">
                <h1 className="text-xl font-bold tracking-tight">{greeting}</h1>
            </div>

            {/* Widgets Grid */}
            <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* Row 1 */}
                <BudgetWidget budget={budget} spent={spent} />
                <TasksWidget />
                <EventsWidget />
                <NetWorthWidget />

                {/* Row 2 */}
                <ExpensesWidget transactions={transactions} />
                <HabitsWidget />
                <QuickLinksWidget />
            </div>

            {/* Date indicator */}
            <div className="text-center text-sm text-muted-foreground pt-4">
                {new Date().toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })}
            </div>
        </div>
    );
}
