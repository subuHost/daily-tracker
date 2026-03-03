"use client";

import * as React from "react";
import { Check, ChevronDown, Loader2, Zap, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateSessionModel } from "@/app/actions/ai";
import { toast } from "sonner";

interface ModelSelectorProps {
    sessionId: string | null;
    currentModel: 'flash' | 'pro';
    onModelChange: (model: 'flash' | 'pro') => void;
}

export function ModelSelector({ sessionId, currentModel, onModelChange }: ModelSelectorProps) {
    const [isPending, setIsPending] = React.useState(false);

    const handleModelSelect = async (model: 'flash' | 'pro') => {
        if (model === currentModel) return;

        if (sessionId) {
            setIsPending(true);
            try {
                await updateSessionModel(sessionId, model);
                onModelChange(model);
                toast.success(`Switched to Gemini ${model === 'flash' ? 'Flash' : 'Pro'}`);
            } catch (error) {
                console.error("Failed to update model:", error);
                toast.error("Failed to update model. Please try again.");
            } finally {
                setIsPending(false);
            }
        } else {
            // New session, just update local state
            onModelChange(model);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium"
                    disabled={isPending}
                >
                    {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                    ) : currentModel === 'flash' ? (
                        <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
                    ) : (
                        <Brain className="h-3.5 w-3.5 text-purple-500 fill-purple-500/20" />
                    )}
                    <span className="text-xs">
                        {currentModel === 'flash' ? 'Gemini Flash' : 'Gemini Pro'}
                    </span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] p-1 shadow-xl border-slate-200 dark:border-slate-800">
                <DropdownMenuItem
                    onClick={() => handleModelSelect('flash')}
                    className={cn(
                        "flex items-center justify-between gap-2 px-3 py-2 cursor-pointer transition-colors",
                        currentModel === 'flash' ? "bg-slate-100 dark:bg-slate-800" : ""
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Zap className={cn("h-4 w-4", currentModel === 'flash' ? "text-amber-500" : "text-slate-400")} />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Flash</span>
                            <span className="text-[10px] text-slate-500 leading-none">Fast & efficient</span>
                        </div>
                    </div>
                    {currentModel === 'flash' && <Check className="h-3.5 w-3.5 text-blue-500" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleModelSelect('pro')}
                    className={cn(
                        "flex items-center justify-between gap-2 px-3 py-2 cursor-pointer transition-colors",
                        currentModel === 'pro' ? "bg-slate-100 dark:bg-slate-800" : ""
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Brain className={cn("h-4 w-4", currentModel === 'pro' ? "text-purple-500" : "text-slate-400")} />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Pro</span>
                            <span className="text-[10px] text-slate-500 leading-none">Complex reasoning</span>
                        </div>
                    </div>
                    {currentModel === 'pro' && <Check className="h-3.5 w-3.5 text-blue-500" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
