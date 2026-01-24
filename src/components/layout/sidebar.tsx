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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Finance", href: "/finance", icon: Wallet },
    { name: "Shopping", href: "/shopping", icon: ShoppingBag },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Journal", href: "/journal", icon: BookOpen },
    { name: "Habits", href: "/habits", icon: Target },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Contacts", href: "/contacts", icon: Users },
    { name: "Gallery", href: "/gallery", icon: Image },
    { name: "Notepad", href: "/notepad", icon: StickyNote },
    { name: "Reports", href: "/reports", icon: BarChart3 },
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
            <div className="flex flex-col flex-grow bg-card border-r">
                {/* Logo */}
                <div className="flex items-center h-16 px-6 border-b">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-sm">DT</span>
                        </div>
                        <span className="font-semibold text-lg">Daily Tracker</span>
                    </div>
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 py-4">
                    <nav className="space-y-1 px-3">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </ScrollArea>

                {/* Bottom section */}
                <div className="p-3 border-t">
                    <Link
                        href="/settings"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                            pathname === "/settings"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <Settings className="h-5 w-5" />
                        Settings
                    </Link>
                    <Separator className="my-2" />
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-5 w-5" />
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    );
}
