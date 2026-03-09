'use client';

// Tech Plan — Phase 6C: Notification System
// Updated NotificationBell with Supabase Realtime support

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { getUnreadCount } from "@/app/actions/notifications";
import { createClient } from "@/lib/supabase/client";

export function NotificationBell() {
    const [count, setCount] = useState(0);
    const pathname = usePathname();

    const load = useCallback(async () => {
        const initialCount = await getUnreadCount();
        setCount(initialCount);
    }, []);

    useEffect(() => {
        load();
    }, [pathname, load]);

    useEffect(() => {
        const supabase = createClient();

        // Subscribe to real-time notifications
        const channel = supabase
            .channel('notifications_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications'
                },
                () => {
                    load();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [load]);

    return (
        <Link href="/notifications">
            <Button variant="ghost" size="icon" className="relative transition-transform active:scale-90 hover:bg-primary/10">
                <Bell className="h-5 w-5 text-foreground/80 hover:text-primary transition-colors" />
                {count > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center border-2 border-background animate-in zoom-in-50 duration-300">
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </Button>
        </Link>
    );
}
