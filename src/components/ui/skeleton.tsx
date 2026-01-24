import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-muted", className)}
            {...props}
        />
    )
}

// Widget-specific skeletons
function WidgetSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("rounded-lg border bg-card p-4", className)}>
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-3/4" />
        </div>
    )
}

function BudgetWidgetSkeleton() {
    return (
        <div className="rounded-lg bg-gradient-to-r from-purple-500/20 to-indigo-600/20 p-4 sm:p-6">
            <Skeleton className="h-3 w-20 mb-2 bg-white/20" />
            <Skeleton className="h-8 w-28 mb-4 bg-white/20" />
            <Skeleton className="h-2 w-full mb-2 bg-white/20" />
            <div className="flex justify-between">
                <Skeleton className="h-3 w-16 bg-white/20" />
                <Skeleton className="h-3 w-16 bg-white/20" />
            </div>
        </div>
    )
}

function TasksWidgetSkeleton() {
    return (
        <div className="rounded-lg border bg-card p-4">
            <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-8" />
            </div>
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <div className="flex-1">
                            <Skeleton className="h-4 w-full mb-1" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ExpensesWidgetSkeleton() {
    return (
        <div className="rounded-lg border bg-card p-4 sm:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-12" />
            </div>
            <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div>
                                <Skeleton className="h-4 w-24 mb-1" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-16" />
                    </div>
                ))}
            </div>
        </div>
    )
}

function HabitsWidgetSkeleton() {
    return (
        <div className="rounded-lg border bg-card p-4">
            <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-8" />
            </div>
            <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Skeleton className="h-6 w-6" />
                        <Skeleton className="h-4 flex-1" />
                    </div>
                ))}
            </div>
        </div>
    )
}

function NetWorthWidgetSkeleton() {
    return (
        <div className="rounded-lg border bg-card p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-28 mb-4" />
            <div className="space-y-2">
                <div className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </div>
        </div>
    )
}

export {
    Skeleton,
    WidgetSkeleton,
    BudgetWidgetSkeleton,
    TasksWidgetSkeleton,
    ExpensesWidgetSkeleton,
    HabitsWidgetSkeleton,
    NetWorthWidgetSkeleton,
}
