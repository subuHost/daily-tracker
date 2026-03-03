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

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function MarkdownMessage({ content }: { content: string }) {
    try {
        return (
            <div className="markdown-content prose dark:prose-invert max-w-none">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || "");
                            const codeContent = String(children).replace(/\n$/, "");

                            if (inline) {
                                return (
                                    <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md font-mono text-[0.85rem] text-blue-600 dark:text-blue-400" {...props}>
                                        {children}
                                    </code>
                                );
                            }

                            return (
                                <div className="relative group/code my-4">
                                    <div className="absolute right-3 top-3 opacity-0 group-hover/code:opacity-100 transition-opacity z-10">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 bg-slate-800/80 hover:bg-slate-900 text-white rounded-md border border-slate-700"
                                            onClick={() => {
                                                navigator.clipboard.writeText(codeContent);
                                                toast.success("Code copied!");
                                            }}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <pre className="bg-slate-950 text-slate-50 p-4 rounded-xl overflow-x-auto border border-slate-800 font-mono text-sm leading-relaxed">
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    </pre>
                                </div>
                            );
                        },
                        table({ children }) {
                            return (
                                <div className="my-4 overflow-x-auto border rounded-xl border-slate-200 dark:border-slate-800 shadow-sm">
                                    <table className="w-full border-collapse text-sm text-left">
                                        {children}
                                    </table>
                                </div>
                            );
                        },
                        thead({ children }) {
                            return <thead className="bg-slate-50 dark:bg-slate-900/50">{children}</thead>;
                        },
                        th({ children }) {
                            return <th className="border-b border-slate-200 dark:border-slate-800 px-4 py-2 font-bold text-slate-700 dark:text-slate-300">{children}</th>;
                        },
                        td({ children }) {
                            return <td className="border-b border-slate-200 dark:border-slate-800 px-4 py-2 text-slate-600 dark:text-slate-400">{children}</td>;
                        },
                        ul({ children }) {
                            return <ul className="list-disc pl-5 space-y-1.5 my-3 leading-relaxed">{children}</ul>;
                        },
                        ol({ children }) {
                            return <ol className="list-decimal pl-5 space-y-1.5 my-3 leading-relaxed">{children}</ol>;
                        },
                        li({ children }) {
                            return <li className="pl-1">{children}</li>;
                        },
                        h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-3">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg font-bold mt-5 mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-bold mt-4 mb-2">{children}</h3>,
                        p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                        blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-4 italic text-slate-700 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-900/10 rounded-r-lg">
                                {children}
                            </blockquote>
                        ),
                        a: ({ node, ...props }: any) => (
                            <a className="text-blue-600 dark:text-blue-400 underline underline-offset-4 hover:text-blue-700 dark:hover:text-blue-300 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />
                        ),
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        );
    } catch (e) {
        console.error("Markdown parsing error:", e);
        return <div className="whitespace-pre-wrap">{content}</div>;
    }
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
                    "relative px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all shadow-sm",
                    isUser
                        ? "bg-blue-600 text-white rounded-tr-none whitespace-pre-wrap"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none"
                )}>
                    {isUser ? message.content : <MarkdownMessage content={message.content} />}
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
