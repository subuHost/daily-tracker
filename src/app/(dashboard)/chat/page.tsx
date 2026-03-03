"use client";

import { useState, useEffect, useRef } from "react";
import {
    Menu,
    Send,
    Mic,
    Image as ImageIcon,
    Sparkles,
    Bot,
    User,
    Loader2,
    History,
    ChevronLeft,
    ChevronRight,
    Search,
    MessageCircle,
    Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatMessages, type Message } from "@/components/chat/chat-messages";
import { useHaptic } from "@/hooks/use-haptic";
import {
    createChatSession,
    getSessionMessages,
    getChatSessions,
    sendMessageInSession,
    getDailyContextAction
} from "@/app/actions/ai";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { ModelSelector } from "@/components/chat/model-selector";

export default function ChatPage() {
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState<'flash' | 'pro'>('flash');

    const haptic = useHaptic();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial load: either find an existing session or start a new one
    useEffect(() => {
        async function init() {
            try {
                const latestSessions = await getChatSessions();
                if (latestSessions && latestSessions.length > 0) {
                    setActiveSessionId(latestSessions[0].id);
                    if (latestSessions[0].model) {
                        setSelectedModel(latestSessions[0].model as 'flash' | 'pro');
                    }
                }
            } catch (e) {
                console.error("Init failed:", e);
            } finally {
                setIsInitialLoading(false);
            }
        }
        init();
    }, []);

    // Load messages when session changes
    useEffect(() => {
        if (!activeSessionId) {
            setMessages([]);
            return;
        }

        async function loadMessages() {
            if (!activeSessionId) return;
            setIsLoading(true);
            try {
                // Update model state from session list
                const latestSessions = await getChatSessions();
                const session = latestSessions.find((s: any) => s.id === activeSessionId);
                if (session?.model) {
                    setSelectedModel(session.model as 'flash' | 'pro');
                }

                const fetched = await getSessionMessages(activeSessionId);
                setMessages(fetched.map(m => ({
                    id: m.id,
                    role: m.role as "user" | "assistant",
                    content: m.content,
                    created_at: m.created_at
                })));
            } catch (error) {
                console.error("Failed to load messages:", error);
                toast.error("Failed to load conversation history");
            } finally {
                setIsLoading(false);
            }
        }
        loadMessages();
    }, [activeSessionId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleNewChat = async () => {
        setIsLoading(true);
        try {
            const session = await createChatSession();
            setActiveSessionId(session.id);
            setSelectedModel('flash'); // Default for new chats
            setMessages([]);
            setSidebarOpen(false);
            haptic.triggerImpact();
            toast.success("New conversation started");
        } catch (error) {
            toast.error("Failed to start new chat");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        let sessionId = activeSessionId;

        // Auto-create session if none active
        if (!sessionId) {
            try {
                const session = await createChatSession();
                sessionId = session.id;
                setActiveSessionId(sessionId);
            } catch (e) {
                toast.error("Failed to create session");
                return;
            }
        }

        const userMsg: Message = { role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);
        haptic.triggerTap();

        try {
            if (!sessionId) {
                throw new Error("No session created");
            }
            const response = await sendMessageInSession(sessionId, input, messages);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: response.content
            }]);
            haptic.triggerSuccess();
        } catch (error) {
            console.error("Failed to send message:", error);
            toast.error("Failed to get response from AI");
            // Optionally remove user message if failed
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] overflow-hidden bg-white dark:bg-slate-950 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800">
            {/* Sidebar Desktop */}
            <aside className="hidden md:block w-72 shrink-0 h-full border-r border-slate-200 dark:border-slate-800">
                <ChatSidebar
                    activeSessionId={activeSessionId || undefined}
                    onSessionSelect={(id) => setActiveSessionId(id)}
                    onNewChat={handleNewChat}
                />
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 relative">
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                            <SheetTrigger asChild className="md:hidden">
                                <Button variant="ghost" size="icon" className="h-9 w-9">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-72 border-none">
                                <ChatSidebar
                                    activeSessionId={activeSessionId || undefined}
                                    onSessionSelect={(id) => {
                                        setActiveSessionId(id);
                                        setSidebarOpen(false);
                                    }}
                                    onNewChat={handleNewChat}
                                />
                            </SheetContent>
                        </Sheet>

                        <div className="flex flex-col">
                            <h2 className="text-sm font-bold flex items-center gap-2">
                                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                                Interactive AI Assistant
                            </h2>
                            <p className="text-[10px] text-slate-500 font-medium tracking-tight">
                                Context-Aware • Powered by Gemini Flash
                            </p>
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-3">
                        <ModelSelector
                            sessionId={activeSessionId}
                            currentModel={selectedModel}
                            onModelChange={setSelectedModel}
                        />
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleNewChat}>
                            <Plus className="h-3.5 w-3.5" />
                            New Chat
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <History className="h-4 w-4 text-slate-400" />
                        </Button>
                    </div>
                </header>

                {/* Messages Container */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth"
                >
                    {isInitialLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <p className="text-sm font-medium">Booting assistant memory...</p>
                        </div>
                    ) : (
                        <ChatMessages messages={messages} isLoading={isLoading} />
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 safe-area-bottom">
                    <form
                        onSubmit={handleSendMessage}
                        className="max-w-4xl mx-auto relative group"
                    >
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-500 rounded-full">
                                <ImageIcon className="h-4 w-4" />
                            </Button>
                        </div>

                        <Input
                            placeholder="Ask about your day, log food, or project finances..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-slate-100 dark:bg-slate-900 border-none pl-12 pr-28 h-12 rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 transition-all shadow-inner"
                        />

                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-500 rounded-full">
                                <Mic className="h-4 w-4" />
                            </Button>
                            <Button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="h-8 px-3 gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                            >
                                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                <span className="text-xs hidden sm:inline">Send</span>
                            </Button>
                        </div>
                    </form>
                    <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
                        Tips: "How much did I spend in Feb?" or "Log a 300kcal healthy snack"
                    </p>
                </div>
            </main>
        </div>
    );
}
