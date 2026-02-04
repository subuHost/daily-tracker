"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send, Sparkles, User, Bot, Loader2, Camera, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { chatWithAI, analyzeAndLogFoodImage, type Message } from "@/app/actions/ai";

interface ChatMessage extends Message {
    imagePreview?: string; // For displaying image in chat
}

// Compress image to reduce file size
async function compressImage(file: File, maxWidth: number = 1024, quality: number = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Scale down if larger than maxWidth
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Convert to JPEG with compression
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                // Extract base64 without prefix
                const base64 = compressedDataUrl.split(',')[1];
                resolve(base64);
            };

            img.onerror = () => reject(new Error('Failed to load image'));
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
    });
}

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "assistant", content: "Hi! I'm your AI health & productivity assistant. How can I help you today? You can also tap the 📷 button to log food by photo!" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: "user", content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await chatWithAI([...messages, userMessage]);
            setMessages(prev => [...prev, response as ChatMessage]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I had trouble connecting. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || isLoading) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Please select an image file (JPEG, PNG, etc.)."
            }]);
            return;
        }

        setIsLoading(true);

        try {
            // Create preview URL for display
            const previewUrl = URL.createObjectURL(file);

            // Add user message with image preview
            setMessages(prev => [...prev, {
                role: "user",
                content: "📸 Analyzing food image...",
                imagePreview: previewUrl
            }]);

            // Compress image before sending (max 1024px, 70% quality for JPEG)
            const base64 = await compressImage(file, 1024, 0.7);

            // Call the image analysis API
            const result = await analyzeAndLogFoodImage(base64, "image/jpeg");

            // Add AI response
            setMessages(prev => [...prev, {
                role: "assistant",
                content: result.message
            }]);

        } catch (error: any) {
            console.error("Image upload error:", error);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `Sorry, I couldn't analyze that image. ${error.message || "Please try again with a clearer photo."}`
            }]);
        } finally {
            setIsLoading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <>
            {/* Toggle Button */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-20 left-4 z-50 h-12 w-12 rounded-full shadow-lg p-0 bg-blue-600 hover:bg-blue-700"
                >
                    <MessageCircle className="h-6 w-6 text-white" />
                </Button>
            )}

            {/* Chat Window */}
            <div className={cn(
                "fixed bottom-20 left-4 z-[70] w-[90vw] md:w-96 transition-all duration-300 ease-in-out origin-bottom-left",
                isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
            )}>
                <Card className="h-[500px] flex flex-col shadow-2xl border-blue-500/20">
                    <CardHeader className="p-4 border-b bg-blue-600 text-white rounded-t-lg flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            <CardTitle className="text-base">AI Assistant</CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white hover:bg-white/20"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </CardHeader>

                    <CardContent ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex items-start gap-2.5",
                                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    m.role === "user" ? "bg-muted" : "bg-blue-100 text-blue-600"
                                )}>
                                    {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>
                                <div className={cn(
                                    "rounded-lg max-w-[80%] text-sm overflow-hidden",
                                    m.role === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    {/* Image preview if present */}
                                    {m.imagePreview && (
                                        <div className="relative">
                                            <img
                                                src={m.imagePreview}
                                                alt="Food"
                                                className="w-full h-32 object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="px-3 py-2 whitespace-pre-wrap">
                                        {m.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm pl-10">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Thinking...
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="p-3 border-t">
                        <form onSubmit={handleSubmit} className="flex w-full gap-2">
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

                            {/* Camera/Image button */}
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                disabled={isLoading}
                                onClick={() => fileInputRef.current?.click()}
                                className="shrink-0"
                                title="Snap food photo"
                            >
                                <Camera className="h-4 w-4" />
                            </Button>

                            <Input
                                placeholder="Log food, add task, or ask anything..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                className="flex-1"
                                disabled={isLoading}
                            />
                            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            </div>
        </>
    );
}
