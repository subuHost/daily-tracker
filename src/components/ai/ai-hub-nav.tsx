"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Mic, Globe, FileText, Plug } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Chat",             href: "/ai/chat",             icon: MessageCircle },
    { name: "Voice",            href: "/ai/voice",            icon: Mic },
    { name: "Web Search",       href: "/ai/tools/search",     icon: Globe },
    { name: "Summarizer",       href: "/ai/tools/summarizer", icon: FileText },
    { name: "MCP Connections",  href: "/ai/mcp",              icon: Plug },
];

export function AiHubNav() {
    const pathname = usePathname();

    return (
        <nav className="flex flex-col gap-1 p-3 pt-4">
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
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                            isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                    </Link>
                );
            })}
        </nav>
    );
}
