"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Wallet,
    CheckSquare,
    Brain,
    Bell,
    MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MoreDrawer } from "./more-drawer";

const primaryNavigation = [
    { name: "Home",    href: "/dashboard",      icon: LayoutDashboard, color: "text-blue-500",   activeBg: "bg-blue-500/15" },
    { name: "Finance", href: "/finance",         icon: Wallet,          color: "text-amber-500",  activeBg: "bg-amber-500/15" },
    { name: "AI Hub",  href: "/ai",              icon: Brain,           color: "text-indigo-500", activeBg: "bg-indigo-500/15", gradient: true },
    { name: "Tasks",   href: "/tasks",           icon: CheckSquare,     color: "text-orange-500", activeBg: "bg-orange-500/15" },
    { name: "Alerts",  href: "/notifications",   icon: Bell,            color: "text-red-500",    activeBg: "bg-red-500/15" },
];

export function MobileNav() {
    const pathname = usePathname();
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] safe-area-bottom">
            {/* Glass bar */}
            <div className="mx-3 mb-3 rounded-2xl glass shadow-2xl shadow-black/20 border border-border/60">
                <nav className="h-16 flex items-center justify-around px-1">
                    {primaryNavigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "relative flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-xl transition-all duration-200 active:scale-90",
                                    isActive ? item.activeBg : "hover:bg-accent/50"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-5 w-5 transition-all duration-200",
                                    isActive ? cn(item.color, "scale-110") : "text-muted-foreground"
                                )} />
                                <span className={cn(
                                    "text-[9px] font-semibold tracking-tight transition-all duration-200",
                                    isActive ? item.color : "text-muted-foreground"
                                )}>
                                    {item.name}
                                </span>
                                {isActive && (
                                    <span className={cn(
                                        "absolute -bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                                        item.color.replace("text-", "bg-")
                                    )} />
                                )}
                            </Link>
                        );
                    })}

                    {/* More Button */}
                    <button
                        onClick={() => setIsMoreOpen(true)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-xl transition-all duration-200 active:scale-90",
                            isMoreOpen ? "bg-accent/50 text-foreground" : "text-muted-foreground hover:bg-accent/50"
                        )}
                    >
                        <MoreHorizontal className="h-5 w-5" />
                        <span className="text-[9px] font-semibold tracking-tight">More</span>
                    </button>
                </nav>
            </div>

            <MoreDrawer isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
        </div>
    );
}
