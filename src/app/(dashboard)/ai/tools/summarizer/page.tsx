"use client";

import { useState } from "react";
import { FileText, Loader2, Copy, Check, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AiHubNav } from "@/components/ai/ai-hub-nav";
import { textToolAction } from "@/app/actions/ai";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Mode = "summarize" | "rewrite" | "translate" | "expand";
type Length = "short" | "medium" | "detailed";

const MODES: { value: Mode; label: string; description: string }[] = [
    { value: "summarize", label: "Summarize", description: "Extract key points concisely" },
    { value: "rewrite",   label: "Rewrite",   description: "Improve clarity and flow" },
    { value: "translate", label: "Translate", description: "Convert to another language" },
    { value: "expand",    label: "Expand",    description: "Add detail and context" },
];

const LANGUAGES = [
    "Spanish", "French", "German", "Japanese", "Chinese (Simplified)",
    "Portuguese", "Arabic", "Hindi", "Korean", "Italian",
    "Russian", "Dutch", "Turkish", "Polish", "Swedish",
];

const MAX_CHARS = 10000;

export default function SummarizerPage() {
    const [input, setInput] = useState("");
    const [mode, setMode] = useState<Mode>("summarize");
    const [length, setLength] = useState<Length>("medium");
    const [targetLanguage, setTargetLanguage] = useState("Spanish");
    const [output, setOutput] = useState("");
    const [wordCount, setWordCount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [copied, setCopied] = useState(false);

    const inputWordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
    const isOverLimit = input.length > MAX_CHARS;

    const handleProcess = async () => {
        if (!input.trim() || isProcessing || isOverLimit) return;
        setIsProcessing(true);
        setOutput("");
        try {
            const result = await textToolAction(input, mode, {
                length,
                targetLanguage: mode === "translate" ? targetLanguage : undefined,
            });
            setOutput(result.result);
            setWordCount(result.wordCount);
        } catch {
            toast.error("Processing failed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopy = async () => {
        if (!output) return;
        await navigator.clipboard.writeText(output);
        setCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendToChat = () => {
        if (!output) return;
        sessionStorage.setItem("ai_chat_prefill", output);
        window.location.href = "/ai/chat";
    };

    return (
        <div className="flex h-full overflow-hidden">
            {/* AI Hub Nav Sidebar */}
            <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-card">
                <AiHubNav />
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
                    {/* Header */}
                    <div>
                        <h1 className="text-xl font-semibold">Text Transformer</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Summarize, rewrite, translate, or expand any text using AI
                        </p>
                    </div>

                    {/* Mode selector */}
                    <div className="flex flex-wrap gap-2">
                        {MODES.map((m) => (
                            <button
                                key={m.value}
                                onClick={() => setMode(m.value)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                                    mode === m.value
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-card text-muted-foreground hover:bg-accent border-transparent"
                                )}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>

                    {/* Options row */}
                    <div className="flex flex-wrap gap-3 items-center">
                        {mode !== "translate" && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Length:</span>
                                <div className="flex rounded-lg border overflow-hidden">
                                    {(["short", "medium", "detailed"] as Length[]).map((l) => (
                                        <button
                                            key={l}
                                            onClick={() => setLength(l)}
                                            className={cn(
                                                "px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                                                length === l
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-card text-muted-foreground hover:bg-accent"
                                            )}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {mode === "translate" && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Translate to:</span>
                                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                                    <SelectTrigger className="h-8 w-44 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LANGUAGES.map((lang) => (
                                            <SelectItem key={lang} value={lang} className="text-xs">
                                                {lang}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* Two-column panel */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Input panel */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Input</span>
                                <div className="flex items-center gap-2">
                                    {isOverLimit && (
                                        <span className="text-[10px] text-destructive flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Too long (max {MAX_CHARS.toLocaleString()} chars)
                                        </span>
                                    )}
                                    <span className={cn("text-[10px] text-muted-foreground", isOverLimit && "text-destructive")}>
                                        {input.length.toLocaleString()}/{MAX_CHARS.toLocaleString()} · {inputWordCount} words
                                    </span>
                                </div>
                            </div>
                            <Textarea
                                placeholder="Paste or type your text here..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className={cn(
                                    "min-h-[320px] text-sm resize-none",
                                    isOverLimit && "border-destructive focus-visible:ring-destructive"
                                )}
                            />
                            <Button
                                onClick={handleProcess}
                                disabled={!input.trim() || isProcessing || isOverLimit}
                                className="w-full gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-4 w-4" />
                                        {MODES.find((m) => m.value === mode)?.label}
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Output panel */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Output</span>
                                {output && (
                                    <Badge variant="secondary" className="text-[10px]">
                                        {wordCount} words
                                    </Badge>
                                )}
                            </div>
                            <div
                                className={cn(
                                    "min-h-[320px] rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed",
                                    !output && "flex items-center justify-center text-muted-foreground"
                                )}
                            >
                                {isProcessing ? (
                                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <span className="text-xs">AI is processing your text...</span>
                                    </div>
                                ) : output ? (
                                    <p className="whitespace-pre-wrap">{output}</p>
                                ) : (
                                    <div className="text-center space-y-3">
                                        <div className="relative inline-block">
                                            <div className="absolute inset-0 rounded-full bg-orange-500/10 scale-[2] animate-pulse" />
                                            <div className="relative w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
                                                <FileText className="h-6 w-6 text-orange-500/60" />
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Your result will appear here</p>
                                    </div>
                                )}
                            </div>
                            {output && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-9 gap-1.5 text-xs"
                                        onClick={handleCopy}
                                    >
                                        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                        {copied ? "Copied!" : "Copy"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-9 gap-1.5 text-xs"
                                        onClick={handleSendToChat}
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                        Send to Chat
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
