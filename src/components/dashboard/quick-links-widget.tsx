"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Wallet,
    ShoppingBag,
    CheckSquare,
    BookOpen,
    Target,
    Calendar,
    ArrowRight,
} from "lucide-react";

const quickLinks = [
    { name: "Add Expense", href: "/finance/expenses/new", icon: Wallet, color: "bg-red-500/10 text-red-500" },
    { name: "Shopping List", href: "/shopping", icon: ShoppingBag, color: "bg-amber-500/10 text-amber-500" },
    { name: "Today's Tasks", href: "/tasks", icon: CheckSquare, color: "bg-blue-500/10 text-blue-500" },
    { name: "Journal", href: "/journal", icon: BookOpen, color: "bg-green-500/10 text-green-500" },
    { name: "Log Habit", href: "/habits", icon: Target, color: "bg-purple-500/10 text-purple-500" },
    { name: "Calendar", href: "/calendar", icon: Calendar, color: "bg-cyan-500/10 text-cyan-500" },
];

export function QuickLinksWidget() {
    return (
        <Card className="col-span-full lg:col-span-1">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Quick Links
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-2">
                    {quickLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors group"
                        >
                            <div className={`p-2 rounded-lg ${link.color}`}>
                                <link.icon className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium flex-1">{link.name}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
