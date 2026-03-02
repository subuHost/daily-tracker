"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Wallet,
    CheckSquare,
    Activity,
    MoreHorizontal,
    MessageCircle,
    StickyNote,
    Target,
    GraduationCap,
    Calendar,
    BookOpen,
    ShoppingBag,
    Users,
    Image,
    BarChart3,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MoreDrawer } from "./more-drawer";

const primaryNavigation = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Finance", href: "/finance", icon: Wallet },
    { name: "Assistant", href: "/chat", icon: MessageCircle },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
];

export function MobileNav() {
    const pathname = usePathname();
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-card/80 backdrop-blur-md border-t safe-area-bottom shadow-lg">
            <nav className="h-16 flex items-center justify-around px-2 max-w-lg mx-auto">
                {primaryNavigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 w-16 h-full transition-all active:scale-90",
                                isActive
                                    ? "text-primary scale-110"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className={cn(
                                "flex items-center justify-center rounded-full transition-colors",
                                isActive && "bg-primary/10 p-2"
                            )}>
                                <item.icon className={cn("h-6 w-6", isActive && "stroke-[2.5px]")} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-medium transition-all",
                                isActive ? "opacity-100" : "opacity-70"
                            )}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}

                {/* More Button */}
                <button
                    onClick={() => setIsMoreOpen(true)}
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 w-16 h-full transition-all active:scale-90",
                        isMoreOpen ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <div className={cn(
                        "flex items-center justify-center rounded-full transition-colors",
                        isMoreOpen && "bg-primary/10 p-2"
                    )}>
                        <MoreHorizontal className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-medium">More</span>
                </button>
            </nav>

            <MoreDrawer isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
        </div>
    );
}

