"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send,
    Bot,
    User,
    Search,
    Loader2,
    Sparkles,
    BrainCircuit,
    ArrowLeft,
    Briefcase,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

interface ModelOption {
    id: string;
    label: string;
    provider: string;
    tier: string;
    available?: boolean;
}

export function FinanceChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState<string>("");
    const [selectedModel, setSelectedModel] = useState("gemini-flash");
    const [deepResearch, setDeepResearch] = useState(false);
    const [models, setModels] = useState<ModelOption[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Load available models
    useEffect(() => {
        async function loadModels() {
            try {
                const { getAvailableModelsAction } = await import("@/app/actions/ai");
                const available = await getAvailableModelsAction();
                setModels(available);
                // Set default to first available model
                const firstAvailable = available.find((m: ModelOption) => m.available);
                if (firstAvailable) setSelectedModel(firstAvailable.id);
            } catch (error) {
                console.error("Failed to load models:", error);
            }
        }
        loadModels();
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const handleSend = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || loading) return;

        const userMessage: ChatMessage = { role: "user", content: trimmed };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);
        setLoadingStage(deepResearch ? "Searching the web for latest data..." : "Thinking...");

        try {
            const { financeChatAction } = await import("@/app/actions/finance-chat");

            if (deepResearch) {
                // Show progressive loading stages
                setTimeout(() => setLoadingStage("Analyzing market data..."), 3000);
                setTimeout(() => setLoadingStage("Generating comprehensive analysis..."), 6000);
            }

            const history = messages.map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            }));

            const result = await financeChatAction(trimmed, history, selectedModel, deepResearch);

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: result.reply },
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: `Error: ${(error as Error).message}. Please check your AI settings.`,
                },
            ]);
        } finally {
            setLoading(false);
            setLoadingStage("");
        }
    }, [input, loading, messages, selectedModel, deepResearch]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Suggested questions
    const suggestions = [
        "How is my portfolio performing?",
        "Which stocks should I be watching?",
        "Analyze my portfolio risk",
        "What's the latest market trend?",
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-card/50 backdrop-blur-sm shrink-0">
                <Link href="/finance/stocks" className="md:hidden">
                    <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                        <BrainCircuit className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">Finance AI Assistant</h2>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            Portfolio & Watchlist aware
                        </p>
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    {/* Deep Research Toggle */}
                    <Button
                        variant={deepResearch ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDeepResearch(!deepResearch)}
                        className={cn(
                            "rounded-full h-8 text-xs gap-1.5 transition-all",
                            deepResearch && "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none shadow-lg shadow-amber-500/20"
                        )}
                    >
                        <Search className="h-3 w-3" />
                        <span className="hidden sm:inline">Deep Research</span>
                    </Button>

                    {/* Model Selector */}
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="h-8 rounded-full border bg-background/80 text-xs px-3 pr-7 appearance-auto cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        {models.map((m) => (
                            <option key={m.id} value={m.id} disabled={!m.available}>
                                {m.label} {!m.available ? "(no key)" : ""}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
                {messages.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                        >
                            <Sparkles className="h-10 w-10 text-amber-500" />
                        </motion.div>
                        <div>
                            <h3 className="text-lg font-semibold mb-1">Finance AI Assistant</h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                                Ask me anything about your portfolio, stocks, market trends, or investment strategies.
                                I have access to your portfolio and watchlist data.
                            </p>
                        </div>

                        {/* Suggestions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                            {suggestions.map((q) => (
                                <button
                                    key={q}
                                    onClick={() => {
                                        setInput(q);
                                        inputRef.current?.focus();
                                    }}
                                    className="text-left text-xs p-3 rounded-xl border bg-card hover:bg-accent transition-colors"
                                >
                                    <span className="text-muted-foreground">{q}</span>
                                </button>
                            ))}
                        </div>

                        {deepResearch && (
                            <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full">
                                <Eye className="h-3.5 w-3.5" />
                                Deep Research mode: AI will search the web for latest market data
                            </div>
                        )}
                    </div>
                )}

                <AnimatePresence>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "flex gap-3",
                                msg.role === "user" ? "justify-end" : "justify-start"
                            )}
                        >
                            {msg.role === "assistant" && (
                                <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mt-1">
                                    <Bot className="h-4 w-4 text-white" />
                                </div>
                            )}
                            <div
                                className={cn(
                                    "rounded-2xl px-4 py-2.5 text-sm max-w-[85%] md:max-w-[75%]",
                                    msg.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-br-md"
                                        : "bg-muted/60 border rounded-bl-md"
                                )}
                            >
                                {msg.role === "assistant" ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-li:my-0.5 prose-headings:my-2">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                )}
                            </div>
                            {msg.role === "user" && (
                                <div className="shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Loading indicator */}
                {loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                    >
                        <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mt-1">
                            <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-muted/60 border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                            <span className="text-sm text-muted-foreground">{loadingStage}</span>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="shrink-0 border-t bg-card/50 backdrop-blur-sm px-4 py-3">
                {deepResearch && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-500 mb-2 px-1">
                        <Search className="h-3 w-3" />
                        Deep Research ON — AI will search the web for latest data
                    </div>
                )}
                <div className="flex items-end gap-2">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about your portfolio, stocks, market..."
                        rows={1}
                        className="flex-1 resize-none rounded-xl border bg-background/80 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[40px] max-h-[120px]"
                        style={{
                            height: "auto",
                            overflow: input.split("\n").length > 3 ? "auto" : "hidden",
                        }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = "auto";
                            target.style.height = Math.min(target.scrollHeight, 120) + "px";
                        }}
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="rounded-xl h-10 w-10 bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20 shrink-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-[9px] text-muted-foreground text-center mt-2 opacity-60">
                    Not financial advice. Consult a qualified advisor before investing.
                </p>
            </div>
        </div>
    );
}
