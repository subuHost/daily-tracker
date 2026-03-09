"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    TrendingUp,
    Search,
    Plus,
    Loader2,
    Star,
    BarChart3,
    Briefcase,
    RefreshCw,
    ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { StockCard } from "@/components/finance/stocks/stock-card";
import { WatchlistItemRow } from "@/components/finance/stocks/watchlist-item";
import {
    getStockQuotes,
    searchSymbol,
    type StockQuote,
} from "@/app/actions/stocks";
import {
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    type WatchlistItem,
} from "@/lib/db/watchlist";
import { getInvestments, type Investment } from "@/lib/db/investments";
import { fetchLivePrices } from "@/app/actions/finance";

// Popular Indian stocks for quick access
const POPULAR_SYMBOLS = [
    { symbol: "RELIANCE", name: "Reliance Industries" },
    { symbol: "TCS", name: "Tata Consultancy Services" },
    { symbol: "INFY", name: "Infosys" },
    { symbol: "HDFCBANK", name: "HDFC Bank" },
    { symbol: "ICICIBANK", name: "ICICI Bank" },
    { symbol: "HINDUNILVR", name: "Hindustan Unilever" },
    { symbol: "BHARTIARTL", name: "Bharti Airtel" },
    { symbol: "ITC", name: "ITC Limited" },
];

export default function StocksPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("portfolio");

    // Portfolio state
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [portfolioQuotes, setPortfolioQuotes] = useState<Record<string, StockQuote>>({});
    const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);

    // Watchlist state
    const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
    const [watchlistQuotes, setWatchlistQuotes] = useState<Record<string, StockQuote>>({});
    const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(true);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<{ symbol: string; description: string; type: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Popular stock quotes
    const [popularQuotes, setPopularQuotes] = useState<Record<string, StockQuote>>({});
    const [isLoadingPopular, setIsLoadingPopular] = useState(true);

    const [isRefreshing, setIsRefreshing] = useState(false);

    // Load portfolio
    useEffect(() => {
        loadPortfolio();
    }, []);

    // Load watchlist
    useEffect(() => {
        loadWatchlist();
    }, []);

    // Load popular stocks
    useEffect(() => {
        loadPopularQuotes();
    }, []);

    const loadPortfolio = async () => {
        setIsLoadingPortfolio(true);
        try {
            const invs = await getInvestments();
            setInvestments(invs);

            // Fetch live prices for stock investments
            const stockInvs = invs.filter((i) => i.type === "stock" || i.type === "mutual_fund");
            if (stockInvs.length > 0) {
                const symbols = Array.from(new Set(stockInvs.map((i) => i.symbol.replace(/\.(NS|BO)$/i, ""))));
                const quotes = await getStockQuotes(symbols);
                setPortfolioQuotes(quotes);
            }
        } catch (error) {
            console.error("Failed to load portfolio:", error);
        } finally {
            setIsLoadingPortfolio(false);
        }
    };

    const loadWatchlist = async () => {
        setIsLoadingWatchlist(true);
        try {
            const items = await getWatchlist();
            setWatchlistItems(items);

            if (items.length > 0) {
                const symbols = items.map((i) => i.symbol);
                const quotes = await getStockQuotes(symbols);
                setWatchlistQuotes(quotes);
            }
        } catch (error) {
            console.error("Failed to load watchlist:", error);
        } finally {
            setIsLoadingWatchlist(false);
        }
    };

    const loadPopularQuotes = async () => {
        setIsLoadingPopular(true);
        try {
            const symbols = POPULAR_SYMBOLS.map((s) => s.symbol);
            const quotes = await getStockQuotes(symbols);
            setPopularQuotes(quotes);
        } catch (error) {
            console.error("Failed to load popular quotes:", error);
        } finally {
            setIsLoadingPopular(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([loadPortfolio(), loadWatchlist(), loadPopularQuotes()]);
            toast.success("Prices refreshed");
        } catch (error) {
            toast.error("Failed to refresh");
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const results = await searchSymbol(query);
            setSearchResults(results);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    const handleAddToWatchlist = async (symbol: string, name?: string) => {
        try {
            await addToWatchlist({ symbol, name });
            toast.success(`${symbol} added to watchlist`);
            loadWatchlist();
            setSearchQuery("");
            setSearchResults([]);
        } catch (error) {
            toast.error("Failed to add to watchlist");
        }
    };

    const handleRemoveFromWatchlist = async (id: string) => {
        try {
            await removeFromWatchlist(id);
            setWatchlistItems((prev) => prev.filter((i) => i.id !== id));
            toast.success("Removed from watchlist");
        } catch (error) {
            toast.error("Failed to remove");
        }
    };

    // Portfolio calculations
    const totalInvested = investments.reduce(
        (sum, inv) => sum + Number(inv.buy_price) * Number(inv.quantity),
        0
    );
    const totalCurrentValue = investments.reduce((sum, inv) => {
        const cleanSymbol = inv.symbol.replace(/\.(NS|BO)$/i, "");
        const quote = portfolioQuotes[cleanSymbol];
        const currentPrice = quote?.current || inv.current_price || inv.buy_price;
        return sum + currentPrice * Number(inv.quantity);
    }, 0);
    const totalGain = totalCurrentValue - totalInvested;
    const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/finance">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Stocks</h1>
                        <p className="text-muted-foreground text-sm">
                            Track your portfolio and watchlist
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw
                            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                        />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Portfolio Summary */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-blue-500" />
                            Total Invested
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold">
                            ₹{totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-purple-500" />
                            Current Value
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-bold">
                            ₹{totalCurrentValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div
                        className={`absolute inset-0 bg-gradient-to-br ${totalGain >= 0 ? "from-emerald-500/10" : "from-red-500/10"
                            } to-transparent`}
                    />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp
                                className={`h-4 w-4 ${totalGain >= 0 ? "text-emerald-500" : "text-red-500"}`}
                            />
                            Total P&L
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={`text-xl sm:text-2xl font-bold ${totalGain >= 0 ? "text-emerald-500" : "text-red-500"
                                }`}
                        >
                            {totalGain >= 0 ? "+" : ""}₹
                            {totalGain.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                            <span className="text-sm font-medium ml-1">
                                ({totalGainPercent >= 0 ? "+" : ""}
                                {totalGainPercent.toFixed(2)}%)
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search stocks by symbol or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-64 overflow-y-auto shadow-lg">
                        <CardContent className="p-1">
                            {searchResults.map((result) => (
                                <div
                                    key={result.symbol}
                                    className="flex items-center justify-between px-3 py-2 hover:bg-accent rounded-md cursor-pointer"
                                >
                                    <div
                                        className="flex-1"
                                        onClick={() =>
                                            router.push(`/finance/stocks/${result.symbol}`)
                                        }
                                    >
                                        <p className="font-medium text-sm">{result.symbol}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {result.description}
                                        </p>
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddToWatchlist(
                                                    result.symbol,
                                                    result.description
                                                );
                                            }}
                                        >
                                            <Star className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="portfolio" className="gap-1.5">
                        <Briefcase className="h-4 w-4" />
                        <span className="hidden sm:inline">Portfolio</span>
                    </TabsTrigger>
                    <TabsTrigger value="watchlist" className="gap-1.5">
                        <Star className="h-4 w-4" />
                        <span className="hidden sm:inline">Watchlist</span>
                    </TabsTrigger>
                    <TabsTrigger value="explore" className="gap-1.5">
                        <TrendingUp className="h-4 w-4" />
                        <span className="hidden sm:inline">Explore</span>
                    </TabsTrigger>
                </TabsList>

                {/* Portfolio Tab */}
                <TabsContent value="portfolio" className="mt-4">
                    {isLoadingPortfolio ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : investments.filter((i) => i.type === "stock" || i.type === "mutual_fund").length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                                <h3 className="text-lg font-medium mb-2">No stock investments</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Add stock investments from the Investments page to see them here.
                                </p>
                                <Button asChild>
                                    <Link href="/finance/investments/new">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Investment
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {investments
                                .filter((i) => i.type === "stock" || i.type === "mutual_fund")
                                .map((inv) => {
                                    const cleanSymbol = inv.symbol.replace(/\.(NS|BO)$/i, "");
                                    const quote = portfolioQuotes[cleanSymbol];
                                    if (quote) {
                                        return (
                                            <StockCard
                                                key={inv.id}
                                                quote={quote}
                                                name={inv.name || undefined}
                                                onClick={() =>
                                                    router.push(`/finance/stocks/${cleanSymbol}`)
                                                }
                                            />
                                        );
                                    }
                                    // Show a placeholder card if no quote
                                    return (
                                        <Card
                                            key={inv.id}
                                            className="cursor-pointer hover:bg-accent/50 transition-colors"
                                            onClick={() =>
                                                router.push(`/finance/stocks/${cleanSymbol}`)
                                            }
                                        >
                                            <CardContent className="p-4">
                                                <p className="font-bold text-sm">{inv.symbol}</p>
                                                <p className="text-xs text-muted-foreground">{inv.name}</p>
                                                <p className="text-sm mt-2 tabular-nums">
                                                    ₹{(inv.current_price || inv.buy_price).toLocaleString("en-IN")}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                        </div>
                    )}
                </TabsContent>

                {/* Watchlist Tab */}
                <TabsContent value="watchlist" className="mt-4">
                    {isLoadingWatchlist ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : watchlistItems.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Star className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                                <h3 className="text-lg font-medium mb-2">Watchlist is empty</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Search for stocks above and add them to your watchlist.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-2">
                                {watchlistItems.map((item) => (
                                    <WatchlistItemRow
                                        key={item.id}
                                        item={item}
                                        quote={watchlistQuotes[item.symbol]}
                                        onClick={() =>
                                            router.push(`/finance/stocks/${item.symbol}`)
                                        }
                                        onRemove={() => handleRemoveFromWatchlist(item.id)}
                                    />
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Explore Tab */}
                <TabsContent value="explore" className="mt-4 space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground">Popular Stocks</h3>
                    {isLoadingPopular ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {POPULAR_SYMBOLS.map(({ symbol, name }) => {
                                const quote = popularQuotes[symbol];
                                if (quote) {
                                    return (
                                        <StockCard
                                            key={symbol}
                                            quote={quote}
                                            name={name}
                                            onClick={() =>
                                                router.push(`/finance/stocks/${symbol}`)
                                            }
                                        />
                                    );
                                }
                                return (
                                    <Card
                                        key={symbol}
                                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                                        onClick={() => router.push(`/finance/stocks/${symbol}`)}
                                    >
                                        <CardContent className="p-4">
                                            <p className="font-bold text-sm">{symbol}</p>
                                            <p className="text-xs text-muted-foreground">{name}</p>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Price unavailable
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
