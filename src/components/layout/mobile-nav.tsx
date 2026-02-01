"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Wallet,
    CheckSquare,
    Target,
    Calendar,
    BookOpen,
    ShoppingBag,
    Users,
    Image,
    BarChart3,
    StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Finance", href: "/finance", icon: Wallet },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Habits", href: "/habits", icon: Target },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Journal", href: "/journal", icon: BookOpen },
    { name: "Shopping", href: "/shopping", icon: ShoppingBag },
    { name: "Contacts", href: "/contacts", icon: Users },
    { name: "Gallery", href: "/gallery", icon: Image },
    { name: "Notes", href: "/notepad", icon: StickyNote },
    { name: "Reports", href: "/reports", icon: BarChart3 },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t safe-area-bottom">
            <nav className="relative h-16">
                <div className="flex items-center gap-1 h-full px-2 overflow-x-auto scrollbar-hide">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0 min-w-[54px]",
                                    isActive
                                        ? "text-primary bg-primary/10"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                                <span className="text-[9px] font-medium truncate max-w-[50px]">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
                {/* Fade gradient on right side to indicate scroll */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none" />
            </nav>
        </div>
    );
}

