"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Mic, Globe, FileText, Plug } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Chat",            href: "/ai/chat",             icon: MessageCircle, color: "text-blue-500",   activeBg: "bg-blue-500/15",   activeText: "text-blue-500" },
    { name: "Voice",           href: "/ai/voice",            icon: Mic,           color: "text-rose-500",   activeBg: "bg-rose-500/15",   activeText: "text-rose-500" },
    { name: "Web Search",      href: "/ai/tools/search",     icon: Globe,         color: "text-emerald-500",activeBg: "bg-emerald-500/15",activeText: "text-emerald-500" },
    { name: "Summarizer",      href: "/ai/tools/summarizer", icon: FileText,      color: "text-orange-500", activeBg: "bg-orange-500/15", activeText: "text-orange-500" },
    { name: "MCP Connections", href: "/ai/mcp",              icon: Plug,          color: "text-purple-500", activeBg: "bg-purple-500/15", activeText: "text-purple-500" },
];

export function AiHubNav() {
    const pathname = usePathname();

    return (
        <nav className="flex flex-col gap-0.5 p-3 pt-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                AI Tools
            </p>
            {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                            isActive
                                ? cn(item.activeBg, item.activeText)
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                    >
                        <div className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-md transition-all",
                            isActive
                                ? cn(item.activeBg, item.color)
                                : "text-muted-foreground group-hover:text-foreground"
                        )}>
                            <item.icon className="h-4 w-4" />
                        </div>
                        <span className="flex-1">{item.name}</span>
                        {isActive && (
                            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", item.color.replace("text-", "bg-"))} />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
