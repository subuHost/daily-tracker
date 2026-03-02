"use client";

import { motion } from "framer-motion";
import { User, Bot, Sparkles, AlertCircle, Copy, Share2, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface Message {
    id?: string;
    role: "user" | "assistant" | "system";
    content: string;
    created_at?: string;
}

interface ChatMessagesProps {
    messages: Message[];
    isLoading?: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
    if (messages.length === 0 && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 max-w-sm mx-auto text-center">
                <div className="p-6 rounded-full bg-slate-100 dark:bg-slate-800 animate-bounce">
                    <Sparkles className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">How can I help you today?</h3>
                <p className="text-sm">
                    I have context on your habits, tasks, finances, and health logs.
                    Ask me for a summary, to log something, or project your goals.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-10">
            {messages.map((message, index) => (
                <ChatMessage key={message.id || index} message={message} />
            ))}

            {isLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-4 max-w-3xl mx-auto w-full px-4"
                >
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                        <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-blue-600 uppercase tracking-widest">Assistant</span>
                            <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />
                        </div>
                        <div className="flex gap-1 items-center bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-2xl rounded-tl-none">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function ChatMessage({ message }: { message: Message }) {
    const isUser = message.role === "user";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(message.content);
        toast.success("Copied to clipboard!");
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex items-start gap-4 max-w-4xl mx-auto w-full px-4",
                isUser ? "flex-row-reverse" : "flex-row"
            )}
        >
            <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10",
                isUser ? "bg-slate-200 dark:bg-slate-700" : "bg-blue-600"
            )}>
                {isUser ? <User className="h-4 w-4 text-slate-600 dark:text-slate-300" /> : <Bot className="h-4 w-4 text-white" />}
            </div>

            <div className={cn(
                "flex flex-col gap-2 group",
                isUser ? "items-end" : "items-start"
            )}>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "font-bold text-[10px] uppercase tracking-widest",
                        isUser ? "text-slate-500" : "text-blue-600"
                    )}>
                        {isUser ? "You" : "Assistant"}
                    </span>
                    {!isUser && <Sparkles className="h-3 w-3 text-blue-500" />}
                </div>

                <div className={cn(
                    "relative px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap transition-all shadow-sm",
                    isUser
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none"
                )}>
                    {message.content}
                </div>

                {/* Message Actions */}
                <div className={cn(
                    "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                    isUser ? "flex-row-reverse" : "flex-row"
                )}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={copyToClipboard}>
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                        <Share2 className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
