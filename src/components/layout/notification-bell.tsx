"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUpcomingBills } from "@/lib/db";
import { getUpcomingEvents } from "@/lib/db/events";

export function NotificationBell() {
    const [count, setCount] = useState(0);
    const [notifications, setNotifications] = useState<{ id: string; title: string; type: "bill" | "event"; days: number }[]>([]);

    useEffect(() => {
        async function load() {
            try {
                const bills = await getUpcomingBills();
                const today = new Date();
                const currentDay = today.getDate();
                const currentMonth = today.getMonth();
                const currentYear = today.getFullYear();

                // Calculate days until due date for bills
                const urgentBills = bills.map(b => {
                    let targetDate = new Date(currentYear, currentMonth, b.due_date);
                    // If due date passed this month, assumes next month (unless it's late!)
                    // Actually if due_date < currentDay, it's late or next month. 
                    // Let's assume simplest check:
                    if (targetDate.getDate() < currentDay) {
                        // It's technically "overdue" if unpaid, so days is negative or 0
                        // Or if we want to show it as due next month? 
                        // "Upcoming" usually means near future. If unmodified, it might be late. 
                        // Let's just treat as "due soon" if close.
                        // But simplistic:
                        if (b.due_date < currentDay) {
                            targetDate = new Date(currentYear, currentMonth + 1, b.due_date);
                        }
                    }

                    const diffTime = targetDate.getTime() - today.getTime();
                    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return { ...b, daysUntil };
                })
                    .filter(b => b.daysUntil <= 3 && b.daysUntil >= -5) // Show due soon or slightly overdue
                    .map(b => ({
                        id: b.id,
                        title: `Bill ${b.daysUntil < 0 ? 'Overdue' : 'Due'}: ${b.name}`,
                        type: "bill" as const,
                        days: b.daysUntil
                    }));

                const events = await getUpcomingEvents(5);
                const urgentEvents = events.filter(e => {
                    const eventDate = new Date(e.date);
                    const diffTime = eventDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 1 && diffDays >= 0;
                }).map(e => ({ id: e.id, title: `Event: ${e.title}`, type: "event" as const, days: 0 }));

                const all = [...urgentBills, ...urgentEvents];
                setNotifications(all);
                setCount(all.length);
            } catch (error) {
                console.error("Failed to notifs", error);
            }
        }
        load();
    }, []);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {count > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                    notifications.map((n) => (
                        <DropdownMenuItem key={`${n.type}-${n.id}`} asChild>
                            <Link href={n.type === 'bill' ? '/bills' : '/calendar'} className="cursor-pointer flex flex-col items-start p-2">
                                <span className="font-medium">{n.title}</span>
                                <span className="text-xs text-muted-foreground">
                                    {n.type === 'bill' ? `Due in ${n.days} days` : 'Happening soon'}
                                </span>
                            </Link>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No new notifications
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
