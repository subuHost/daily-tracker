"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { StockQuote } from "@/app/actions/stocks";

interface StockCardProps {
    quote: StockQuote;
    name?: string;
    onClick?: () => void;
}

export function StockCard({ quote, name, onClick }: StockCardProps) {
    const isPositive = quote.change > 0;
    const isNeutral = quote.change === 0;

    return (
        <Card
            className="cursor-pointer hover:bg-accent/50 transition-all duration-200 hover:shadow-md group"
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">
                            {quote.symbol}
                        </h3>
                        {name && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {name}
                            </p>
                        )}
                    </div>
                    <div className="text-right ml-3">
                        <p className="font-bold text-sm tabular-nums">
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
                </div>

                {/* Mini price bar */}
                <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>L: ₹{quote.low?.toLocaleString("en-IN")}</span>
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${isPositive ? "bg-emerald-500/60" : "bg-red-500/60"
                                }`}
                            style={{
                                width: `${quote.high - quote.low > 0
                                        ? ((quote.current - quote.low) / (quote.high - quote.low)) * 100
                                        : 50
                                    }%`,
                            }}
                        />
                    </div>
                    <span>H: ₹{quote.high?.toLocaleString("en-IN")}</span>
                </div>
            </CardContent>
        </Card>
    );
}
