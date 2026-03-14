"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send, Sparkles, User, Bot, Loader2, Camera, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    chatWithAI,
    analyzeAndLogFoodImage,
    loadChatHistory,
    persistImageChatMessages,
    clearChatHistoryAction,
    getDailyContextAction,
    type Message,
} from "@/app/actions/ai";
import { compressImage } from "@/lib/utils/compress-image";

interface ChatMessage extends Message {
    imagePreview?: string; // For displaying image in chat
}

const WELCOME_MESSAGE: ChatMessage = {
    role: "assistant",
    content: "Hi! I'm your AI health & productivity assistant. How can I help you today? You can also tap the 📷 button to log food by photo!",
};

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const historyLoaded = useRef(false);
    const userContextRef = useRef<string>("");

    // Load persisted chat history and daily context on mount
    useEffect(() => {
        if (historyLoaded.current) return;
        historyLoaded.current = true;

        // Load chat history
        loadChatHistory()
            .then((history) => {
                if (history.length > 0) {
                    setMessages(history as ChatMessage[]);
                }
            })
            .catch((err) => {
                console.error("Failed to load chat history:", err);
            })
            .finally(() => {
                setIsLoadingHistory(false);
            });

        // Load daily context (non-blocking, for context-aware chat)
        getDailyContextAction()
            .then((ctx) => {
                userContextRef.current = ctx;
            })
            .catch((err) => {
                console.error("Failed to load daily context:", err);
            });
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await chatWithAI([...messages, userMessage], userContextRef.current || undefined);
            setMessages((prev) => [...prev, response as ChatMessage]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, I had trouble connecting. Please try again." },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || isLoading) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Please select an image file (JPEG, PNG, etc.).",
                },
            ]);
            return;
        }

        setIsLoading(true);

        try {
            // Create preview URL for display
            const previewUrl = URL.createObjectURL(file);

            const userContent = "📸 Analyzing food image...";

            // Add user message with image preview
            setMessages((prev) => [
                ...prev,
                {
                    role: "user",
                    content: userContent,
                    imagePreview: previewUrl,
                },
            ]);

            // Compress image before sending (max 1024px, 70% quality for JPEG)
            const base64 = await compressImage(file, 1024, 0.7);

            // Call the image analysis API
            const result = await analyzeAndLogFoodImage(base64, "image/jpeg");

            // Add AI response
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: result.message,
                },
            ]);

            // Persist both messages to the database (Bug Fix #2)
            await persistImageChatMessages(userContent, result.message);
        } catch (error: any) {
            console.error("Image upload error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: `Sorry, I couldn't analyze that image. ${error.message || "Please try again with a clearer photo."}`,
                },
            ]);
        } finally {
            setIsLoading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleClearHistory = async () => {
        if (!confirm("Clear all chat history? This cannot be undone.")) return;
        try {
            await clearChatHistoryAction();
            setMessages([WELCOME_MESSAGE]);
        } catch (error) {
            console.error("Failed to clear chat history:", error);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-[calc(10rem+env(safe-area-inset-bottom))] right-4 z-[50] h-12 w-12 rounded-full shadow-lg p-0 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all md:bottom-24 md:right-8"
                >
                    <MessageCircle className="h-6 w-6 text-white" />
                    <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-pulse" />
                </Button>
            )}

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={cn(
                            "fixed z-[70] transition-all duration-300 ease-in-out",
                            "w-full h-[100dvh] inset-0 md:inset-auto md:h-[600px] md:w-[400px] md:bottom-24 md:right-8"
                        )}
                    >
                        <Card className={cn(
                            "h-full flex flex-col shadow-2xl border-blue-500/20 md:rounded-2xl overflow-hidden",
                            "rounded-none border-0"
                        )}>
                            <CardHeader className="p-4 border-b bg-blue-600 text-white flex flex-row items-center justify-between space-y-0 shrink-0 h-16 safe-area-top">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5" />
                                    <CardTitle className="text-base">AI Assistant</CardTitle>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-white hover:bg-white/20"
                                        onClick={handleClearHistory}
                                        title="Clear chat history"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-white hover:bg-white/20"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                                {isLoadingHistory ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-3">
                                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                        <p>Refreshing memory…</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {messages.map((m, i) => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                key={i}
                                                className={cn(
                                                    "flex items-start gap-2.5",
                                                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                                        m.role === "user" ? "bg-muted" : "bg-blue-600 text-white"
                                                    )}
                                                >
                                                    {m.role === "user" ? (
                                                        <User className="h-4 w-4" />
                                                    ) : (
                                                        <Bot className="h-4 w-4" />
                                                    )}
                                                </div>
                                                <div
                                                    className={cn(
                                                        "rounded-2xl max-w-[85%] text-sm overflow-hidden shadow-sm",
                                                        m.role === "user"
                                                            ? "bg-blue-600 text-white rounded-tr-none"
                                                            : "bg-muted text-foreground rounded-tl-none border"
                                                    )}
                                                >
                                                    {/* Image preview if present */}
                                                    {m.imagePreview && (
                                                        <div className="relative">
                                                            <img
                                                                src={m.imagePreview}
                                                                alt="Food"
                                                                className="w-full h-48 object-cover"
                                                                onLoad={() => {
                                                                    if (scrollRef.current) {
                                                                        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="px-4 py-2.5 whitespace-pre-wrap leading-relaxed">{m.content}</div>
                                                </div>
                                            </motion.div>
                                        ))}
                                        {isLoading && (
                                            <div className="flex items-center gap-2 text-muted-foreground text-sm pl-10">
                                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                                Thinking...
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="p-4 border-t bg-card h-auto safe-area-bottom">
                                <form onSubmit={handleSubmit} className="flex w-full gap-2 items-end">
                                    {/* Hidden file input */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={isLoading}
                                    />

                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        disabled={isLoading}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="shrink-0 rounded-xl h-10 w-10 border-blue-500/20 hover:bg-blue-50 text-blue-600"
                                        title="Snap photo"
                                    >
                                        <Camera className="h-5 w-5" />
                                    </Button>

                                    <div className="flex-1 relative flex items-center">
                                        <Input
                                            placeholder="Ask anything..."
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            className="pr-10 py-5 rounded-xl border-blue-500/20 focus-visible:ring-blue-600"
                                            disabled={isLoading}
                                        />
                                        <Button
                                            type="submit"
                                            size="icon"
                                            disabled={isLoading || !input.trim()}
                                            className="absolute right-1 h-8 w-8 rounded-lg bg-blue-600 text-white"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
