"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Calendar,
    BookOpen,
    ShoppingBag,
    Users,
    Image,
    BarChart3,
    StickyNote,
    Target,
    GraduationCap,
    X,
    Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const secondaryNavigation = [
    { name: "Health", href: "/health", icon: Activity },
    { name: "Study", href: "/study", icon: GraduationCap },
    { name: "Habits", href: "/habits", icon: Target },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Journal", href: "/journal", icon: BookOpen },
    { name: "Shopping", href: "/shopping", icon: ShoppingBag },
    { name: "Contacts", href: "/contacts", icon: Users },
    { name: "Gallery", href: "/gallery", icon: Image },
    { name: "Notes", href: "/notepad", icon: StickyNote },
    { name: "Reports", href: "/reports", icon: BarChart3 },
];

interface MoreDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MoreDrawer({ isOpen, onClose }: MoreDrawerProps) {
    const pathname = usePathname();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] md:hidden"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-card border-t rounded-t-[2rem] z-[101] md:hidden px-6 pt-2 pb-10 shadow-2xl safe-area-bottom"
                    >
                        {/* Handle */}
                        <div className="flex justify-center mb-6">
                            <div className="w-12 h-1.5 bg-muted rounded-full" />
                        </div>

                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold">More Modules</h2>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <nav className="grid grid-cols-3 gap-y-6 gap-x-4">
                            {secondaryNavigation.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={onClose}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all active:scale-95",
                                            isActive
                                                ? "text-primary bg-primary/10 shadow-sm"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-3 rounded-xl",
                                            isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                                        )}>
                                            <item.icon className="h-6 w-6" />
                                        </div>
                                        <span className="text-[11px] font-medium">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
