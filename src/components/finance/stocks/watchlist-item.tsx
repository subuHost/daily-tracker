"use client";

import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Star, Trash2 } from "lucide-react";
import type { WatchlistItem } from "@/lib/db/watchlist";
import type { StockQuote } from "@/app/actions/stocks";

interface WatchlistItemRowProps {
    item: WatchlistItem;
    quote?: StockQuote | null;
    onClick?: () => void;
    onRemove?: () => void;
}

export function WatchlistItemRow({ item, quote, onClick, onRemove }: WatchlistItemRowProps) {
    const isPositive = quote ? quote.change > 0 : false;
    const isNeutral = quote ? quote.change === 0 : true;

    return (
        <div
            className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer rounded-lg group"
            onClick={onClick}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 rounded-lg bg-amber-500/10">
                    <Star className="h-4 w-4 text-amber-500" />
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-sm">{item.symbol}</p>
                    <p className="text-xs text-muted-foreground truncate">
                        {item.name || item.exchange}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {quote ? (
                    <div className="text-right">
                        <p className="font-semibold text-sm tabular-nums">
                            ₹{quote.current.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </p>
                        <div
                            className={`flex items-center justify-end gap-0.5 text-xs font-medium ${isNeutral
                                    ? "text-muted-foreground"
                                    : isPositive
                                        ? "text-emerald-500"
                                        : "text-red-500"
                                }`}
                        >
                            {isNeutral ? (
                                <Minus className="h-3 w-3" />
                            ) : isPositive ? (
                                <TrendingUp className="h-3 w-3" />
                            ) : (
                                <TrendingDown className="h-3 w-3" />
                            )}
                            <span className="tabular-nums">
                                {isPositive ? "+" : ""}
                                {quote.changePercent?.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove?.();
                    }}
                >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
            </div>
        </div>
    );
}
