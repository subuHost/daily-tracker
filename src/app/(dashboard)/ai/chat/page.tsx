"use client";

import { useState, useEffect, useRef } from "react";
import {
    Menu,
    Send,
    Sparkles,
    Loader2,
    Plus,
    Globe,
    Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatMessages, type Message } from "@/components/chat/chat-messages";
import { useHaptic } from "@/hooks/use-haptic";
import {
    createChatSession,
    getSessionMessages,
    getChatSessions,
    sendMessageInSession,
    getAvailableModelsAction,
    webSearchAction,
} from "@/app/actions/ai";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ModelSelector } from "@/components/chat/model-selector";

export default function AiChatPage() {
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>("gemini-flash");
    const [availableModels, setAvailableModels] = useState<any[]>([]);
    const [webSearchMode, setWebSearchMode] = useState(false);
    const [mcpPanelOpen, setMcpPanelOpen] = useState(false);

    const haptic = useHaptic();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function init() {
            try {
                const models = await getAvailableModelsAction();
                setAvailableModels(models);

                const latestSessions = await getChatSessions();
                if (latestSessions && latestSessions.length > 0) {
                    setActiveSessionId(latestSessions[0].id);
                    if (latestSessions[0].model) {
                        setSelectedModel(latestSessions[0].model);
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

    useEffect(() => {
        if (!activeSessionId) {
            setMessages([]);
            return;
        }

        async function loadMessages() {
            if (!activeSessionId) return;
            setIsLoading(true);
            try {
                const latestSessions = await getChatSessions();
                const session = latestSessions.find((s: any) => s.id === activeSessionId);
                if (session?.model) setSelectedModel(session.model);

                const fetched = await getSessionMessages(activeSessionId);
                setMessages(
                    fetched.map((m: any) => ({
                        id: m.id,
                        role: m.role as "user" | "assistant",
                        content: m.content,
                        created_at: m.created_at,
                    }))
                );
            } catch {
                toast.error("Failed to load conversation history");
            } finally {
                setIsLoading(false);
            }
        }
        loadMessages();
    }, [activeSessionId]);

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
            setSelectedModel("gemini-flash");
            setMessages([]);
            setSidebarOpen(false);
            haptic.triggerImpact();
            toast.success("New conversation started");
        } catch {
            toast.error("Failed to start new chat");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        let sessionId = activeSessionId;
        if (!sessionId) {
            try {
                const session = await createChatSession();
                sessionId = session.id;
                setActiveSessionId(sessionId);
            } catch {
                toast.error("Failed to create session");
                return;
            }
        }

        const userMsg: Message = {
            role: "user",
            content: webSearchMode ? `🌐 ${input}` : input,
        };
        setMessages((prev) => [...prev, userMsg]);
        const currentInput = input;
        setInput("");
        setIsLoading(true);
        haptic.triggerTap();

        try {
            if (!sessionId) throw new Error("No session created");

            let responseContent: string;

            if (webSearchMode) {
                const searchResult = await webSearchAction(currentInput);
                responseContent = searchResult.content;
                if (searchResult.citations && searchResult.citations.length > 0) {
                    responseContent +=
                        "\n\n**Sources:**\n" +
                        searchResult.citations.map((c: string) => `- ${c}`).join("\n");
                }
            } else {
                const response = await sendMessageInSession(sessionId, currentInput, messages);
                responseContent = response.content;
            }

            setMessages((prev) => [...prev, { role: "assistant", content: responseContent }]);
            haptic.triggerSuccess();
        } catch {
            toast.error("Failed to get response from AI");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-full overflow-hidden bg-white dark:bg-slate-950 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800">
            {/* Session Sidebar — Desktop */}
            <aside className="hidden md:block w-72 shrink-0 h-full border-r border-slate-200 dark:border-slate-800">
                <ChatSidebar
                    activeSessionId={activeSessionId || undefined}
                    onSessionSelect={(id) => setActiveSessionId(id)}
                    onNewChat={handleNewChat}
                />
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 relative overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Mobile session drawer */}
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
                                AI Chat
                            </h2>
                            <p className="text-[10px] text-slate-500 font-medium tracking-tight">
                                Context-Aware · Powered by Gemini
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <ModelSelector
                            sessionId={activeSessionId}
                            currentModel={selectedModel}
                            onModelChange={setSelectedModel as any}
                            availableModels={availableModels}
                        />
                        <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
                        {/* MCP Tools Button */}
                        <Sheet open={mcpPanelOpen} onOpenChange={setMcpPanelOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs text-slate-500 hover:text-primary"
                                    title="MCP Tools"
                                >
                                    <Plug className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">MCP Tools</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-72 p-4">
                                <div className="flex flex-col gap-3">
                                    <h3 className="font-semibold text-sm flex items-center gap-2">
                                        <Plug className="h-4 w-4" />
                                        MCP Tools
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Connect MCP servers in the{" "}
                                        <a href="/ai/mcp" className="text-primary underline">
                                            MCP Connections
                                        </a>{" "}
                                        section to enable external tools in this chat.
                                    </p>
                                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                                        <div className="text-center space-y-2">
                                            <Plug className="h-8 w-8 mx-auto opacity-30" />
                                            <p className="text-xs">No MCP servers connected yet</p>
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5 hidden sm:flex"
                            onClick={handleNewChat}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            New Chat
                        </Button>
                    </div>
                </header>

                {/* Messages */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth"
                >
                    {isInitialLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <p className="text-sm font-medium">Loading assistant...</p>
                        </div>
                    ) : (
                        <ChatMessages messages={messages} isLoading={isLoading} />
                    )}
                </div>

                {/* Input */}
                <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 safe-area-bottom shrink-0">
                    {webSearchMode && (
                        <div className="flex items-center gap-1.5 mb-2">
                            <Badge variant="secondary" className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                                🌐 Web Search Active
                            </Badge>
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative group">
                        <Input
                            placeholder={
                                webSearchMode
                                    ? "Search the web..."
                                    : "Ask anything, log health data, check finances..."
                            }
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                            className={cn(
                                "w-full pr-24 h-12 rounded-2xl focus-visible:ring-2 transition-all shadow-inner border-none",
                                webSearchMode
                                    ? "bg-violet-50 dark:bg-violet-950/30 focus-visible:ring-violet-500"
                                    : "bg-slate-100 dark:bg-slate-900 focus-visible:ring-blue-500"
                            )}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setWebSearchMode(!webSearchMode)}
                                className={cn(
                                    "h-8 w-8 rounded-full transition-colors",
                                    webSearchMode
                                        ? "text-violet-600 bg-violet-100 dark:bg-violet-900/30 hover:bg-violet-200"
                                        : "text-slate-400 hover:text-violet-500"
                                )}
                                title={webSearchMode ? "Web search ON" : "Enable web search"}
                            >
                                <Globe className="h-4 w-4" />
                            </Button>
                            <Button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="h-8 px-3 gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Send className="h-3.5 w-3.5" />
                                )}
                                <span className="text-xs hidden sm:inline">Send</span>
                            </Button>
                        </div>
                    </form>
                    <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
                        {webSearchMode
                            ? "🌐 Web search enabled — results powered by Perplexity"
                            : 'Tips: "How much did I spend in Feb?" or "Log a healthy snack"'}
                    </p>
                </div>
            </main>
        </div>
    );
}
