"use client";

import { useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from "recharts";
import type { StockCandle } from "@/app/actions/stocks";

interface PriceChartProps {
    candles: StockCandle | null;
    symbol: string;
    height?: number;
    showVolume?: boolean;
}

export function PriceChart({ candles, symbol, height = 300, showVolume = false }: PriceChartProps) {
    const chartData = useMemo(() => {
        if (!candles || !candles.close.length) return [];

        return candles.timestamp.map((ts, i) => ({
            date: new Date(ts * 1000).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
            }),
            fullDate: new Date(ts * 1000).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
            }),
            open: candles.open[i],
            high: candles.high[i],
            low: candles.low[i],
            close: candles.close[i],
            volume: candles.volume[i],
        }));
    }, [candles]);

    if (!chartData.length) {
        return (
            <div
                className="flex items-center justify-center text-muted-foreground text-sm"
                style={{ height }}
            >
                No chart data available for {symbol}
            </div>
        );
    }

    const isPositive = chartData[chartData.length - 1].close >= chartData[0].close;
    const lineColor = isPositive ? "#10b981" : "#ef4444";
    const gradientId = `gradient-${symbol}`;

    return (
        <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={lineColor} stopOpacity={0.2} />
                            <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        interval="preserveStartEnd"
                        minTickGap={40}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        domain={["auto", "auto"]}
                        tickFormatter={(v) => `₹${(v / 1).toLocaleString("en-IN")}`}
                        width={70}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const data = payload[0].payload;
                            return (
                                <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                                    <p className="text-xs text-muted-foreground mb-1">
                                        {data.fullDate}
                                    </p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                                        <span className="text-muted-foreground">Open</span>
                                        <span className="font-medium tabular-nums text-right">
                                            ₹{data.open?.toLocaleString("en-IN")}
                                        </span>
                                        <span className="text-muted-foreground">High</span>
                                        <span className="font-medium tabular-nums text-right text-emerald-500">
                                            ₹{data.high?.toLocaleString("en-IN")}
                                        </span>
                                        <span className="text-muted-foreground">Low</span>
                                        <span className="font-medium tabular-nums text-right text-red-500">
                                            ₹{data.low?.toLocaleString("en-IN")}
                                        </span>
                                        <span className="text-muted-foreground">Close</span>
                                        <span className="font-bold tabular-nums text-right">
                                            ₹{data.close?.toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                </div>
                            );
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="close"
                        stroke={lineColor}
                        strokeWidth={2}
                        fill={`url(#${gradientId})`}
                        dot={false}
                        activeDot={{
                            r: 4,
                            fill: lineColor,
                            stroke: "hsl(var(--background))",
                            strokeWidth: 2,
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
