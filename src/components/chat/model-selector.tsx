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

import { ModelOption } from "@/lib/ai/model-router";

interface ModelSelectorProps {
    sessionId: string | null;
    currentModel: string;
    onModelChange: (model: string) => void;
    availableModels?: ModelOption[];
}

export function ModelSelector({ sessionId, currentModel, onModelChange, availableModels = [] }: ModelSelectorProps) {
    const [isPending, setIsPending] = React.useState(false);

    const handleModelSelect = async (model: string) => {
        if (model === currentModel) return;

        if (sessionId) {
            setIsPending(true);
            try {
                await updateSessionModel(sessionId, model);
                onModelChange(model);
                toast.success(`Switched to ${model}`);
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

    // Map old 'flash'/'pro' local state to the newer IDs if necessary
    let displayModel = currentModel;
    if (displayModel === 'flash') displayModel = 'gemini-flash';
    if (displayModel === 'pro') displayModel = 'gemini-pro';

    const currentModelOption = availableModels?.find(m => m.id === displayModel) || {
        id: displayModel,
        label: displayModel,
        provider: 'gemini',
        tier: displayModel.includes('pro') || displayModel.includes('sonnet') || displayModel.includes('gpt-4o') && !displayModel.includes('mini') ? 'thinking' : 'fast'
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
                    ) : currentModelOption.tier === 'fast' ? (
                        <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
                    ) : (
                        <Brain className="h-3.5 w-3.5 text-purple-500 fill-purple-500/20" />
                    )}
                    <span className="text-xs">
                        {currentModelOption.label}
                    </span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] p-1 shadow-xl border-slate-200 dark:border-slate-800">
                {['fast', 'thinking'].map((tier) => {
                    const tierModels = (availableModels || []).filter(m => m.tier === tier);
                    if (!tierModels.length) return null;

                    return (
                        <React.Fragment key={tier}>
                            <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                {tier === 'fast' ? <Zap className="h-3 w-3" /> : <Brain className="h-3 w-3" />}
                                {tier === 'fast' ? 'Fast Models' : 'Thinking Models'}
                            </div>
                            {tierModels.map(model => (
                                <DropdownMenuItem
                                    key={model.id}
                                    onClick={() => handleModelSelect(model.id)}
                                    disabled={!("available" in model) || !(model as any).available}
                                    className={cn(
                                        "flex items-center justify-between gap-2 px-3 py-2 cursor-pointer transition-colors",
                                        displayModel === model.id ? "bg-slate-100 dark:bg-slate-800" : ""
                                    )}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{model.label}</span>
                                        <span className="text-[10px] text-slate-500 leading-none">
                                            {model.provider === 'gemini' ? 'Free' : (model as any).available ? 'Key set ✓' : 'Key required'}
                                        </span>
                                    </div>
                                    {displayModel === model.id && <Check className="h-3.5 w-3.5 text-blue-500" />}
                                </DropdownMenuItem>
                            ))}
                        </React.Fragment>
                    );
                })}
                {/* Fallback for when availableModels is empty */}
                {(!availableModels || availableModels.length === 0) && (
                    <>
                        <DropdownMenuItem
                            onClick={() => handleModelSelect('gemini-flash')}
                            className={cn(
                                "flex items-center justify-between gap-2 px-3 py-2 cursor-pointer transition-colors",
                                displayModel === 'gemini-flash' ? "bg-slate-100 dark:bg-slate-800" : ""
                            )}
                        >
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">Gemini Flash</span>
                                <span className="text-[10px] text-slate-500 leading-none">Fast & efficient</span>
                            </div>
                            {displayModel === 'gemini-flash' && <Check className="h-3.5 w-3.5 text-blue-500" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleModelSelect('gemini-pro')}
                            className={cn(
                                "flex items-center justify-between gap-2 px-3 py-2 cursor-pointer transition-colors",
                                displayModel === 'gemini-pro' ? "bg-slate-100 dark:bg-slate-800" : ""
                            )}
                        >
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">Gemini Pro</span>
                                <span className="text-[10px] text-slate-500 leading-none">Complex reasoning</span>
                            </div>
                            {displayModel === 'gemini-pro' && <Check className="h-3.5 w-3.5 text-blue-500" />}
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
