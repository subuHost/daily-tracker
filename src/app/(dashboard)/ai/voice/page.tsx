"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiHubNav } from "@/components/ai/ai-hub-nav";
import { voiceChatAction, type VoiceMessage } from "@/app/actions/ai";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

declare global {
    interface Window {
        SpeechRecognition: typeof SpeechRecognition;
        webkitSpeechRecognition: typeof SpeechRecognition;
    }
}

export default function VoicePage() {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [conversation, setConversation] = useState<VoiceMessage[]>([]);
    const [isSupported, setIsSupported] = useState(true);
    const [autoSpeak, setAutoSpeak] = useState(true);
    const [statusText, setStatusText] = useState("Tap the mic to start");

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const conversationEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
            setIsListening(true);
            setStatusText("Listening...");
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const current = event.results[event.results.length - 1];
            const text = current[0].transcript;
            setTranscript(text);
            if (current.isFinal) {
                setIsListening(false);
                handleSendVoice(text);
            }
        };

        recognition.onerror = () => {
            setIsListening(false);
            setStatusText("Tap the mic to start");
            setTranscript("");
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversation]);

    const handleSendVoice = useCallback(
        async (text: string) => {
            if (!text.trim()) {
                setStatusText("Tap the mic to start");
                return;
            }

            setTranscript("");
            setIsProcessing(true);
            setStatusText("Thinking...");

            const userMsg: VoiceMessage = { role: "user", content: text };
            setConversation((prev) => [...prev, userMsg]);

            try {
                const response = await voiceChatAction(text, [
                    ...conversation,
                    userMsg,
                ]);

                const aiMsg: VoiceMessage = { role: "assistant", content: response };
                setConversation((prev) => [...prev, aiMsg]);

                if (autoSpeak) {
                    speakText(response);
                } else {
                    setStatusText("Tap the mic to start");
                }
            } catch {
                toast.error("Failed to get AI response");
                setStatusText("Tap the mic to start");
            } finally {
                setIsProcessing(false);
            }
        },
        [conversation, autoSpeak] // eslint-disable-line react-hooks/exhaustive-deps
    );

    const speakText = (text: string) => {
        if (typeof window === "undefined" || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onstart = () => {
            setIsSpeaking(true);
            setStatusText("Speaking...");
        };
        utterance.onend = () => {
            setIsSpeaking(false);
            setStatusText("Tap the mic to start");
        };
        utterance.onerror = () => {
            setIsSpeaking(false);
            setStatusText("Tap the mic to start");
        };
        window.speechSynthesis.speak(utterance);
    };

    const handleMicClick = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
            }
            setTranscript("");
            try {
                recognitionRef.current.start();
            } catch {
                // already started
            }
        }
    };

    const handleStopSpeaking = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setStatusText("Tap the mic to start");
    };

    const handleClear = () => {
        window.speechSynthesis.cancel();
        setConversation([]);
        setTranscript("");
        setIsListening(false);
        setIsSpeaking(false);
        setIsProcessing(false);
        setStatusText("Tap the mic to start");
    };

    if (!isSupported) {
        return (
            <div className="flex h-full overflow-hidden">
                <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-card">
                    <AiHubNav />
                </aside>
                <main className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center space-y-4 max-w-sm">
                        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
                        <h2 className="text-lg font-semibold">Browser Not Supported</h2>
                        <p className="text-sm text-muted-foreground">
                            Voice chat requires the Web Speech API, which is available in Chrome on desktop and Android. Please open this page in Chrome.
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-full overflow-hidden">
            {/* AI Hub Nav Sidebar */}
            <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-card">
                <AiHubNav />
            </aside>

            {/* Voice Chat Main */}
            <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-background to-muted/20">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                    <div>
                        <h1 className="font-semibold text-base">Voice Assistant</h1>
                        <p className="text-xs text-muted-foreground">Speak naturally, AI responds in voice</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 gap-1.5 text-xs",
                                autoSpeak ? "text-primary" : "text-muted-foreground"
                            )}
                            onClick={() => setAutoSpeak(!autoSpeak)}
                            title={autoSpeak ? "Auto-speak ON" : "Auto-speak OFF"}
                        >
                            {autoSpeak ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                            <span className="hidden sm:inline">
                                {autoSpeak ? "Voice On" : "Voice Off"}
                            </span>
                        </Button>
                        {conversation.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                                onClick={handleClear}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Clear</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Conversation History */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                    {conversation.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3 pb-24">
                            <Mic className="h-10 w-10 opacity-20" />
                            <p className="text-sm font-medium">Start a voice conversation</p>
                            <p className="text-xs max-w-xs">
                                Tap the microphone button below and speak. The AI will respond both in text and voice.
                            </p>
                        </div>
                    )}
                    {conversation.map((msg, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex max-w-[80%]",
                                msg.role === "user" ? "ml-auto" : "mr-auto"
                            )}
                        >
                            <div
                                className={cn(
                                    "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                                    msg.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-br-sm"
                                        : "bg-card border rounded-bl-sm"
                                )}
                            >
                                {msg.content}
                                {msg.role === "assistant" && autoSpeak && (
                                    <button
                                        onClick={() => speakText(msg.content)}
                                        className="ml-2 opacity-50 hover:opacity-100 inline-flex items-center"
                                        title="Play again"
                                    >
                                        <Volume2 className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {transcript && (
                        <div className="flex max-w-[80%] ml-auto">
                            <div className="px-4 py-3 rounded-2xl rounded-br-sm text-sm bg-primary/20 text-primary border border-primary/30 italic">
                                {transcript}
                            </div>
                        </div>
                    )}
                    <div ref={conversationEndRef} />
                </div>

                {/* Mic Control Area */}
                <div className="shrink-0 flex flex-col items-center gap-4 pb-8 pt-4 border-t bg-card/50 backdrop-blur-sm">
                    {/* Waveform animation */}
                    {isListening && (
                        <div className="flex items-end gap-1 h-8">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className="w-1.5 bg-primary rounded-full"
                                    style={{
                                        animation: `voiceWave 0.8s ease-in-out infinite alternate`,
                                        animationDelay: `${i * 0.1}s`,
                                        height: `${12 + i * 4}px`,
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground font-medium">{statusText}</p>

                    <div className="flex items-center gap-4">
                        {/* Stop speaking button */}
                        {isSpeaking && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 gap-1.5 text-xs"
                                onClick={handleStopSpeaking}
                            >
                                <VolumeX className="h-3.5 w-3.5" />
                                Stop
                            </Button>
                        )}

                        {/* Main mic button */}
                        <button
                            onClick={handleMicClick}
                            disabled={isProcessing}
                            className={cn(
                                "relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-200 shadow-lg",
                                isListening
                                    ? "bg-red-500 text-white scale-110 shadow-red-500/40"
                                    : isProcessing
                                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                                    : "bg-primary text-primary-foreground hover:scale-105 hover:shadow-primary/40"
                            )}
                        >
                            {isProcessing ? (
                                <span className="flex gap-1">
                                    {[0, 1, 2].map((i) => (
                                        <span
                                            key={i}
                                            className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                                            style={{ animationDelay: `${i * 0.15}s` }}
                                        />
                                    ))}
                                </span>
                            ) : isListening ? (
                                <MicOff className="h-8 w-8" />
                            ) : (
                                <Mic className="h-8 w-8" />
                            )}
                            {isListening && (
                                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
                            )}
                        </button>
                    </div>
                </div>
            </main>

            <style>{`
                @keyframes voiceWave {
                    from { transform: scaleY(0.4); }
                    to   { transform: scaleY(1.4); }
                }
            `}</style>
        </div>
    );
}
