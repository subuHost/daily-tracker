"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Minus,
    Star,
    Loader2,
    Briefcase,
    Building,
    Globe,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { PriceChart } from "@/components/finance/stocks/price-chart";
import { ResearchPanel } from "@/components/finance/stocks/research-panel";
import {
    getStockQuote,
    getStockCandles,
    getCompanyProfile,
    type StockQuote,
    type StockCandle,
    type CompanyProfile,
} from "@/app/actions/stocks";
import { getAvailableModelsAction } from "@/app/actions/ai";
import { isInWatchlist, addToWatchlist, removeFromWatchlist } from "@/lib/db/watchlist";

export default function StockDetailPage({ params }: { params: { symbol: string } }) {
    const router = useRouter();
    const symbol = decodeURIComponent(params.symbol).toUpperCase();
    const cleanSymbol = symbol.replace(/\.(NS|BO)$/i, ""); // Ensure Finnhub compatible format

    const [quote, setQuote] = useState<StockQuote | null>(null);
    const [profile, setProfile] = useState<CompanyProfile | null>(null);
    const [candles, setCandles] = useState<StockCandle | null>(null);
    const [timeframe, setTimeframe] = useState<"1W" | "1M" | "3M" | "1Y" | "5Y">("1Y");

    const [isWatched, setIsWatched] = useState(false);
    const [watchId, setWatchId] = useState<string | null>(null); // Real app would get the id

    const [isLoading, setIsLoading] = useState(true);
    const [availableModels, setAvailableModels] = useState<any[]>([]);

    useEffect(() => {
        loadData();
        checkWatchlist();
    }, [cleanSymbol]);

    useEffect(() => {
        loadChartData();
    }, [cleanSymbol, timeframe]);

    const loadData = async () => {
        try {
            const [q, p, models] = await Promise.all([
                getStockQuote(cleanSymbol),
                getCompanyProfile(cleanSymbol),
                getAvailableModelsAction()
            ]);
            setQuote(q);
            setProfile(p);
            setAvailableModels(models);
        } catch (error) {
            console.error("Failed to load stock data:", error);
            toast.error("Failed to load generic data");
        } finally {
            setIsLoading(false);
        }
    };

    const loadChartData = async () => {
        try {
            const now = Math.floor(Date.now() / 1000);
            const daysMap = {
                "1W": 7,
                "1M": 30,
                "3M": 90,
                "1Y": 365,
                "5Y": 1825,
            };
            const from = now - daysMap[timeframe] * 24 * 60 * 60;
            const res = timeframe === "1W" || timeframe === "1M" ? "60" : "D"; // Use intraday for short
            const c = await getStockCandles(cleanSymbol, res, from, now);
            setCandles(c);
        } catch (error) {
            console.error("Failed to load chart:", error);
        }
    };

    const checkWatchlist = async () => {
        const watched = await isInWatchlist(cleanSymbol);
        setIsWatched(watched);
    };

    const toggleWatchlist = async () => {
        try {
            if (isWatched) {
                // In a real app we'd need the ID to remove, or a deleteBySymbol function.
                // Assuming we implemented deleteBySymbol or get it before deleting.
                // For simplicity here, we assume user manages removals from watchlist page if we don't have ID.
                toast.error("Remove from the Watchlist page");
            } else {
                await addToWatchlist({ symbol: cleanSymbol, name: profile?.name || undefined });
                setIsWatched(true);
                toast.success("Added to watchlist");
            }
        } catch (error) {
            toast.error("Failed to update watchlist");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="space-y-4 text-center py-20">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h1 className="text-xl font-bold">Stock not found</h1>
                <p className="text-sm text-muted-foreground">
                    Could not load data for symbol {symbol}
                </p>
                <Button variant="outline" onClick={() => router.back()} className="mt-4">
                    Go Back
                </Button>
            </div>
        );
    }

    const isPositive = quote.change > 0;
    const isNeutral = quote.change === 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <Button variant="ghost" size="icon" asChild className="mt-1">
                        <Link href="/finance/stocks">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                                {cleanSymbol}
                            </h1>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={toggleWatchlist}
                            >
                                <Star
                                    className={`h-5 w-5 ${isWatched ? "fill-amber-500 text-amber-500" : "text-muted-foreground"
                                        }`}
                                />
                            </Button>
                        </div>
                        <p className="text-muted-foreground">
                            {profile?.name || "Company Profile Unavailable"}
                            {profile?.exchange && ` • ${profile.exchange}`}
                        </p>
                    </div>
                </div>

                <div className="text-left sm:text-right ml-12 sm:ml-0">
                    <p className="text-3xl sm:text-4xl font-bold tabular-nums">
                        ₹{quote.current.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </p>
                    <div
                        className={`flex items-center sm:justify-end gap-1 font-medium mt-1 ${isNeutral
                            ? "text-muted-foreground"
                            : isPositive
                                ? "text-emerald-500"
                                : "text-red-500"
                            }`}
                    >
                        {isNeutral ? (
                            <Minus className="h-4 w-4" />
                        ) : isPositive ? (
                            <TrendingUp className="h-4 w-4" />
                        ) : (
                            <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="tabular-nums">
                            {isPositive ? "+" : ""}
                            ₹{Math.abs(quote.change).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{" "}
                            ({quote.changePercent?.toFixed(2)}%)
                        </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Live from Finnhub</p>
                </div>
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                {/* Main Content: Chart + Research */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Price Chart */}
                    <Card>
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-semibold text-base sm:text-lg">Price History</h3>
                                <div className="flex bg-muted rounded-md p-1">
                                    {["1W", "1M", "3M", "1Y", "5Y"].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setTimeframe(t as any)}
                                            className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-sm transition-colors ${timeframe === t
                                                ? "bg-background text-foreground shadow"
                                                : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {!candles ? (
                                <div className="h-[300px] flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <PriceChart candles={candles} symbol={cleanSymbol} />
                            )}
                        </CardContent>
                    </Card>

                    {/* AI Research Agent */}
                    <ResearchPanel symbol={cleanSymbol} companyName={profile?.name} availableModels={availableModels} />
                </div>

                {/* Sidebar: Stats + Profile */}
                <div className="space-y-6">
                    <Card>
                        <CardContent className="p-4 sm:p-6 space-y-4">
                            <h3 className="font-semibold text-base mb-2">Today&apos;s Statistics</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Open</p>
                                    <p className="font-medium text-sm tabular-nums">
                                        ₹{quote.open?.toLocaleString("en-IN")}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Previous Close</p>
                                    <p className="font-medium text-sm tabular-nums">
                                        ₹{quote.previousClose?.toLocaleString("en-IN")}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-muted-foreground mb-1">Day Range</p>
                                    <div className="flex items-center justify-between text-sm font-medium tabular-nums">
                                        <span>₹{quote.low?.toLocaleString("en-IN")}</span>
                                        <span>₹{quote.high?.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-primary/60"
                                            style={{
                                                width: `${quote.high - quote.low > 0
                                                    ? ((quote.current - quote.low) / (quote.high - quote.low)) * 100
                                                    : 50
                                                    }%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {profile && (
                        <Card>
                            <CardContent className="p-4 sm:p-6 space-y-4">
                                <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    Company Info
                                </h3>
                                <div className="space-y-3">
                                    {profile.industry && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">Industry</p>
                                            <p className="text-sm font-medium">{profile.industry}</p>
                                        </div>
                                    )}
                                    {profile.marketCap > 0 && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">Market Cap</p>
                                            <p className="text-sm font-medium">
                                                {profile.currency} {(profile.marketCap).toLocaleString("en-US", { maximumFractionDigits: 0 })}M
                                            </p>
                                        </div>
                                    )}
                                    {profile.country && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">Country</p>
                                            <p className="text-sm font-medium">{profile.country}</p>
                                        </div>
                                    )}
                                    {profile.weburl && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">Website</p>
                                            <a
                                                href={profile.weburl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                                            >
                                                {profile.weburl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                                                <Globe className="h-3 w-3" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
