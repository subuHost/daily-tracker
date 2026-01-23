"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Wallet,
    CheckSquare,
    Target,
    MoreHorizontal,
    Calendar,
    BookOpen,
    ShoppingBag,
    Users,
    Image,
    BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mainNavigation = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Finance", href: "/finance", icon: Wallet },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Habits", href: "/habits", icon: Target },
];

const moreNavigation = [
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Journal", href: "/journal", icon: BookOpen },
    { name: "Shopping", href: "/shopping", icon: ShoppingBag },
    { name: "Contacts", href: "/contacts", icon: Users },
    { name: "Gallery", href: "/gallery", icon: Image },
    { name: "Reports", href: "/reports", icon: BarChart3 },
];

export function MobileNav() {
    const pathname = usePathname();

    const isMoreActive = moreNavigation.some(
        (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    );

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t safe-area-bottom">
            <nav className="flex items-center justify-around h-16 px-2">
                {mainNavigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    );
                })}

                {/* More Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] outline-none",
                                isMoreActive
                                    ? "text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <MoreHorizontal className={cn("h-5 w-5", isMoreActive && "stroke-[2.5px]")} />
                            <span className="text-[10px] font-medium">More</span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        side="top"
                        sideOffset={16}
                        className="w-48 z-[100]"
                    >
                        {moreNavigation.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <DropdownMenuItem key={item.name} asChild>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 w-full cursor-pointer",
                                            isActive && "text-primary font-medium"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.name}
                                    </Link>
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </nav>
        </div>
    );
}
