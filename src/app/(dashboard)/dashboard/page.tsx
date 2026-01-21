import { BudgetWidget } from "@/components/dashboard/budget-widget";
import { TasksWidget } from "@/components/dashboard/tasks-widget";
import { ExpensesWidget } from "@/components/dashboard/expenses-widget";
import { HabitsWidget } from "@/components/dashboard/habits-widget";
import { NetWorthWidget } from "@/components/dashboard/net-worth-widget";
import { QuickLinksWidget } from "@/components/dashboard/quick-links-widget";
import { getGreeting } from "@/lib/utils";

export default function DashboardPage() {
    const greeting = getGreeting();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="hidden md:block">
                <h1 className="text-2xl font-bold tracking-tight">{greeting}, Subodh</h1>
                <p className="text-muted-foreground">
                    Here&apos;s what&apos;s happening with your life today.
                </p>
            </div>

            {/* Widgets Grid */}
            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {/* Row 1 */}
                <BudgetWidget budget={50000} spent={32500} />
                <TasksWidget />
                <NetWorthWidget balance={125000} investments={350000} debts={50000} />

                {/* Row 2 */}
                <ExpensesWidget />
                <HabitsWidget gymStreak={12} gymDays={18} readingStreak={5} meditationStreak={3} />
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
