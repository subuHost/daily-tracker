"use client";

import { NotificationBell } from "./notification-bell";
import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getGreeting, getInitials } from "@/lib/utils";
import Link from "next/link";

import { GlobalSearch } from "./global-search";

export function Header() {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser({
                    email: user.email,
                    name: user.user_metadata?.name || user.email?.split("@")[0],
                });
            }
        };
        getUser();
    }, [supabase.auth]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/auth/login");
    };

    return (
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">
                {/* Greeting for mobile */}
                <div className="md:hidden">
                    <p className="text-sm text-muted-foreground">{getGreeting()},</p>
                    <p className="font-semibold">{user?.name || "User"}</p>
                </div>

                {/* Search bar */}
                <div className="hidden md:flex flex-1 max-w-md">
                    <GlobalSearch />
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    {/* Mobile search */}
                    <div className="md:hidden">
                        <GlobalSearch />
                    </div>

                    {/* Notifications */}
                    <NotificationBell />

                    {/* Theme toggle */}
                    <ThemeToggle />

                    {/* User menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src="" alt={user?.name} />
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {getInitials(user?.name || "U")}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/settings">Settings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
