import { Suspense } from "react";
import { BudgetWidget } from "@/components/dashboard/budget-widget";
import { TasksWidget } from "@/components/dashboard/tasks-widget";
import { ExpensesWidget } from "@/components/dashboard/expenses-widget";
import { HabitsWidget } from "@/components/dashboard/habits-widget";
import { NetWorthWidget } from "@/components/dashboard/net-worth-widget";
import { QuickLinksWidget } from "@/components/dashboard/quick-links-widget";
import { getCurrentBudget, getMonthlySpent, getTransactions } from "@/lib/db";
import { EventsWidget } from "@/components/widgets/events-widget";
import { TransactionReviewStack } from "@/components/dashboard/transaction-review-stack";
import { getGreeting } from "@/lib/utils";
import {
    BudgetWidgetSkeleton,
    TasksWidgetSkeleton,
    ExpensesWidgetSkeleton,
    HabitsWidgetSkeleton,
    NetWorthWidgetSkeleton,
    WidgetSkeleton,
} from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";

// Server-side data fetchers
async function getBudgetData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { budget: undefined, spent: 0 };

    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    // Get current budget
    const { data: budgetData } = await supabase
        .from("budgets")
        .select("amount")
        .eq("user_id", user.id)
        .eq("month", monthStr)
        .single();

    // Get monthly spent
    const startDate = monthStr;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${lastDay}`;

    const { data: expenses } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .gte("date", startDate)
        .lte("date", endDate);

    const spent = (expenses || []).reduce((sum, t) => sum + Number(t.amount), 0);

    return {
        budget: budgetData?.amount ? Number(budgetData.amount) : undefined,
        spent,
    };
}

async function getRecentTransactions() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: txns } = await supabase
        .from("transactions")
        .select(`*, categories (name, color)`)
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(10);

    return (txns || []).map((t: any) => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        date: t.date,
        type: t.type as "expense" | "income",
        category: t.categories?.name || "Uncategorized",
    }));
}

// Async Server Components for each widget
async function BudgetWidgetServer() {
    const { budget, spent } = await getBudgetData();
    return <BudgetWidget budget={budget} spent={spent} />;
}

async function ExpensesWidgetServer() {
    const transactions = await getRecentTransactions();
    return <ExpensesWidget transactions={transactions} />;
}

export default function DashboardPage() {
    const greeting = getGreeting();

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

            {/* Widgets Grid with Suspense Boundaries */}
            <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* Budget Widget */}
                <Suspense fallback={<BudgetWidgetSkeleton />}>
                    <BudgetWidgetServer />
                </Suspense>

                {/* Tasks Widget */}
                <Suspense fallback={<TasksWidgetSkeleton />}>
                    <TasksWidget />
                </Suspense>

                {/* Events Widget */}
                <Suspense fallback={<WidgetSkeleton />}>
                    <EventsWidget />
                </Suspense>

                {/* Net Worth Widget */}
                <Suspense fallback={<NetWorthWidgetSkeleton />}>
                    <NetWorthWidget />
                </Suspense>

                {/* Expenses Widget */}
                <Suspense fallback={<ExpensesWidgetSkeleton />}>
                    <ExpensesWidgetServer />
                </Suspense>

                {/* Transaction Review Widget */}
                <div className="md:col-span-1">
                    <TransactionReviewStack />
                </div>

                {/* Habits Widget */}
                <Suspense fallback={<HabitsWidgetSkeleton />}>
                    <HabitsWidget />
                </Suspense>

                {/* Quick Links - No async, renders immediately */}
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
