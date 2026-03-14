"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Wallet,
    ShoppingBag,
    CheckSquare,
    BookOpen,
    Target,
    Calendar,
    Users,
    Image,
    BarChart3,
    Settings,
    LogOut,
    StickyNote,
    Activity,
    GraduationCap,
    Brain,
    Bell,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navigation = [
    { name: "Dashboard",     href: "/dashboard",     icon: LayoutDashboard, color: "text-blue-500",    bg: "bg-blue-500/10" },
    { name: "Health",        href: "/health",        icon: Activity,        color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { name: "Finance",       href: "/finance",       icon: Wallet,          color: "text-amber-500",   bg: "bg-amber-500/10" },
    { name: "Shopping",      href: "/shopping",      icon: ShoppingBag,     color: "text-pink-500",    bg: "bg-pink-500/10" },
    { name: "Tasks",         href: "/tasks",         icon: CheckSquare,     color: "text-orange-500",  bg: "bg-orange-500/10" },
    { name: "Journal",       href: "/journal",       icon: BookOpen,        color: "text-violet-500",  bg: "bg-violet-500/10" },
    { name: "Habits",        href: "/habits",        icon: Target,          color: "text-cyan-500",    bg: "bg-cyan-500/10" },
    { name: "Calendar",      href: "/calendar",      icon: Calendar,        color: "text-sky-500",     bg: "bg-sky-500/10" },
    { name: "AI Hub",        href: "/ai",            icon: Brain,           color: "text-indigo-500",  bg: "bg-indigo-500/10", isAI: true },
    { name: "Contacts",      href: "/contacts",      icon: Users,           color: "text-teal-500",    bg: "bg-teal-500/10" },
    { name: "Gallery",       href: "/gallery",       icon: Image,           color: "text-rose-500",    bg: "bg-rose-500/10" },
    { name: "Notepad",       href: "/notepad",       icon: StickyNote,      color: "text-yellow-500",  bg: "bg-yellow-500/10" },
    { name: "Study",         href: "/study",         icon: GraduationCap,   color: "text-purple-500",  bg: "bg-purple-500/10" },
    { name: "Reports",       href: "/reports",       icon: BarChart3,       color: "text-blue-400",    bg: "bg-blue-400/10" },
    { name: "Notifications", href: "/notifications", icon: Bell,            color: "text-red-500",     bg: "bg-red-500/10" },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/auth/login");
    };

    return (
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
            <div className="flex flex-col flex-grow bg-[hsl(var(--sidebar))] border-r border-[hsl(var(--sidebar-border))]">

                {/* Logo */}
                <div className="flex items-center h-16 px-5 border-b border-[hsl(var(--sidebar-border))]">
                    <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Sparkles className="w-4 h-4 text-white" />
                            <span className="sr-only">DT</span>
                        </div>
                        <div>
                            <span className="font-bold text-sm tracking-tight">Daily Tracker</span>
                            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">AI-Powered Life OS</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 py-3">
                    <nav className="space-y-0.5 px-2">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    )}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-6 h-6 rounded-md transition-all",
                                        isActive
                                            ? cn(item.bg, item.color)
                                            : "text-muted-foreground group-hover:text-foreground"
                                    )}>
                                        <item.icon className="h-4 w-4" />
                                    </div>
                                    <span className="flex-1">{item.name}</span>
                                    {item.isAI && (
                                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                            AI
                                        </span>
                                    )}
                                    {isActive && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </ScrollArea>

                {/* Bottom section */}
                <div className="p-2 border-t border-[hsl(var(--sidebar-border))] space-y-0.5">
                    <Link
                        href="/settings"
                        className={cn(
                            "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                            pathname === "/settings"
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                    >
                        <div className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-md",
                            pathname === "/settings" ? "bg-primary/10 text-primary" : "text-muted-foreground"
                        )}>
                            <Settings className="h-4 w-4" />
                        </div>
                        Settings
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                        <div className="flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground group-hover:text-destructive">
                            <LogOut className="h-4 w-4" />
                        </div>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
