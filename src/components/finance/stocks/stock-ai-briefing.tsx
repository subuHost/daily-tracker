"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Sparkles,
    Loader2,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    RefreshCw,
    ExternalLink,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import {
    generateWatchlistBriefing,
    type WatchlistBriefing,
    type WatchlistStockBrief,
} from "@/app/actions/stocks";

interface StockAiBriefingProps {
    stocks: { symbol: string; name: string }[];
}

const BRIEFING_CACHE_KEY = "stock_briefing_cache";

interface CachedBriefing {
    date: string;
    briefing: WatchlistBriefing;
}

const sentimentConfig = {
    bullish: {
        icon: TrendingUp,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        label: "Bullish",
    },
    bearish: {
        icon: TrendingDown,
        color: "text-red-500",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
        label: "Bearish",
    },
    neutral: {
        icon: Minus,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        label: "Neutral",
    },
};

export function StockAiBriefing({ stocks }: StockAiBriefingProps) {
    const [briefing, setBriefing] = useState<WatchlistBriefing | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Load cached briefing on mount
    useEffect(() => {
        try {
            const cached = localStorage.getItem(BRIEFING_CACHE_KEY);
            if (cached) {
                const parsed: CachedBriefing = JSON.parse(cached);
                const today = new Date().toISOString().split("T")[0];
                if (parsed.date === today && parsed.briefing) {
                    setBriefing(parsed.briefing);
                    setIsExpanded(true);
                }
            }
        } catch {
            /* ignore */
        }
    }, []);

    const handleGenerate = async () => {
        if (stocks.length === 0) return;
        setIsLoading(true);
        try {
            const result = await generateWatchlistBriefing(stocks);
            setBriefing(result);
            setIsExpanded(true);

            // Cache for today
            const today = new Date().toISOString().split("T")[0];
            localStorage.setItem(
                BRIEFING_CACHE_KEY,
                JSON.stringify({ date: today, briefing: result })
            );
        } catch (error) {
            console.error("Briefing generation failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (stocks.length === 0) return null;

    return (
        <Card className="relative overflow-hidden border-blue-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />

            <CardHeader className="relative pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-500/10">
                            <Sparkles className="h-4 w-4 text-blue-500" />
                        </div>
                        AI Market Briefing
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {briefing && (
                            <span className="text-[10px] text-muted-foreground">
                                via {briefing.provider}
                            </span>
                        )}
                        {briefing && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative space-y-3">
                {/* No briefing yet — show generate button */}
                {!briefing && !isLoading && (
                    <div className="flex items-center justify-between py-1">
                        <p className="text-xs text-muted-foreground">
                            Get AI-powered insights for your {stocks.length} watchlist{" "}
                            {stocks.length === 1 ? "stock" : "stocks"}
                        </p>
                        <Button
                            size="sm"
                            onClick={handleGenerate}
                            className="gap-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700"
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            Generate Briefing
                        </Button>
                    </div>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className="flex items-center gap-3 py-4 justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        <div>
                            <p className="text-sm font-medium">
                                Analyzing {stocks.length} stocks...
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Searching news, processing market data
                            </p>
                        </div>
                    </div>
                )}

                {/* Briefing Content */}
                {briefing && !isLoading && (
                    <>
                        {/* Market Overview — always visible */}
                        <p className="text-sm leading-relaxed">
                            {briefing.marketOverview}
                        </p>

                        {/* Alerts */}
                        {briefing.alerts?.length > 0 && (
                            <div className="space-y-1.5">
                                {briefing.alerts.map((alert, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-2 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-2 rounded-lg border border-amber-500/20"
                                    >
                                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                        <span>{alert}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Per-stock cards — collapsible */}
                        {isExpanded && briefing.stocks?.length > 0 && (
                            <div className="grid gap-2 sm:grid-cols-2">
                                {briefing.stocks.map((stock) => (
                                    <StockBriefCard key={stock.symbol} stock={stock} />
                                ))}
                            </div>
                        )}

                        {/* Citations */}
                        {isExpanded && briefing.citations?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {briefing.citations.slice(0, 5).map((url, i) => {
                                    let hostname = url;
                                    try {
                                        hostname = new URL(url).hostname.replace("www.", "");
                                    } catch {
                                        /* ignore */
                                    }
                                    return (
                                        <a
                                            key={i}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline bg-primary/5 px-2 py-0.5 rounded"
                                        >
                                            <ExternalLink className="h-2.5 w-2.5" />
                                            {hostname}
                                        </a>
                                    );
                                })}
                            </div>
                        )}

                        {/* Collapse toggle + Regenerate */}
                        {isExpanded && (
                            <div className="flex items-center gap-2 pt-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs gap-1.5 flex-1"
                                    onClick={handleGenerate}
                                >
                                    <RefreshCw className="h-3 w-3" />
                                    Refresh Briefing
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function StockBriefCard({ stock }: { stock: WatchlistStockBrief }) {
    const config = sentimentConfig[stock.sentiment] || sentimentConfig.neutral;
    const Icon = config.icon;

    return (
        <div className={`rounded-lg border ${config.border} p-3 space-y-1.5`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{stock.symbol}</span>
                    <Badge
                        variant="secondary"
                        className={`text-[10px] h-5 ${config.bg} ${config.color} border ${config.border}`}
                    >
                        <Icon className="h-3 w-3 mr-0.5" />
                        {config.label}
                    </Badge>
                </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
                {stock.summary}
            </p>
            {stock.keyChange && (
                <p className={`text-xs font-medium ${config.color}`}>
                    {stock.keyChange}
                </p>
            )}
        </div>
    );
}
