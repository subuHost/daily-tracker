"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronLeft, Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createInvestment } from "@/lib/db";
import { searchIndianStocks, getStockQuote } from "@/app/actions/stocks";

const investmentSchema = z.object({
    symbol: z.string().min(1, "Symbol is required"),
    name: z.string().optional(),
    buyPrice: z.string().min(1, "Buy price is required"),
    quantity: z.string().min(1, "Quantity is required"),
    buyDate: z.string().min(1, "Date is required"),
    type: z.string().min(1, "Type is required"),
    note: z.string().optional(),
});

type InvestmentForm = z.infer<typeof investmentSchema>;

interface StockSuggestion {
    symbol: string;
    name: string;
    exchange: string;
    type: string;
}

export default function NewInvestmentPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isFetchingPrice, setIsFetchingPrice] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<InvestmentForm>({
        resolver: zodResolver(investmentSchema),
        defaultValues: {
            buyDate: new Date().toISOString().split("T")[0],
            type: "stock",
        },
    });

    const selectedSymbol = watch("symbol");

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Debounced search
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setValue("symbol", value.toUpperCase());

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (value.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const results = await searchIndianStocks(value);
                setSuggestions(results);
                setShowSuggestions(results.length > 0);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsSearching(false);
            }
        }, 350);
    };

    // Select a stock from suggestions
    const handleSelectStock = async (stock: StockSuggestion) => {
        setValue("symbol", stock.symbol);
        setValue("name", stock.name);
        setSearchQuery(stock.symbol);
        setShowSuggestions(false);
        setSuggestions([]);

        // Fetch current price
        setIsFetchingPrice(true);
        try {
            const quote = await getStockQuote(stock.symbol);
            if (quote && quote.current > 0) {
                setValue("buyPrice", quote.current.toFixed(2));
                toast.success(`Current price: ₹${quote.current.toFixed(2)}`);
            }
        } catch (error) {
            console.error("Price fetch failed:", error);
        } finally {
            setIsFetchingPrice(false);
        }
    };

    const onSubmit = async (data: InvestmentForm) => {
        setIsLoading(true);
        try {
            await createInvestment({
                symbol: data.symbol.toUpperCase(),
                name: data.name || null,
                buy_price: parseFloat(data.buyPrice),
                quantity: parseFloat(data.quantity),
                buy_date: data.buyDate,
                type: data.type as "stock" | "crypto" | "mutual_fund" | "other",
                note: data.note || null,
            });
            toast.success("Investment added successfully!");
            router.push("/finance/investments");
        } catch (error) {
            console.error("Failed to add investment:", error);
            toast.error("Failed to add investment. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/finance/investments">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Add Investment</h1>
                    <p className="text-muted-foreground">Track your portfolio</p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                defaultValue="stock"
                                onValueChange={(value) => setValue("type", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="stock">Stock</SelectItem>
                                    <SelectItem value="crypto">Crypto</SelectItem>
                                    <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Symbol with Autocomplete */}
                        <div className="space-y-2 relative" ref={dropdownRef}>
                            <Label htmlFor="symbol">Symbol / Ticker</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="symbol"
                                    placeholder="Search stocks... e.g., Reliance, HDFC"
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                    className="pl-9 pr-8"
                                    autoComplete="off"
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                                {searchQuery && !isSearching && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setValue("symbol", "");
                                            setValue("name", "");
                                            setSuggestions([]);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                    </button>
                                )}
                            </div>
                            {errors.symbol && (
                                <p className="text-sm text-destructive">{errors.symbol.message}</p>
                            )}

                            {/* Suggestions Dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
                                    {suggestions.map((stock, i) => (
                                        <button
                                            key={`${stock.symbol}-${stock.exchange}-${i}`}
                                            type="button"
                                            onClick={() => handleSelectStock(stock)}
                                            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 transition-colors border-b border-border/50 last:border-b-0"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm">{stock.symbol}</p>
                                                <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
                                            </div>
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0 ml-2">
                                                {stock.exchange}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Name (auto-filled)</Label>
                            <Input
                                id="name"
                                placeholder="Full name of the investment"
                                {...register("name")}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="buyPrice">
                                    Buy Price (₹)
                                    {isFetchingPrice && <Loader2 className="inline ml-1 h-3 w-3 animate-spin" />}
                                </Label>
                                <Input
                                    id="buyPrice"
                                    type="number"
                                    step="0.01"
                                    placeholder="0"
                                    {...register("buyPrice")}
                                />
                                {errors.buyPrice && (
                                    <p className="text-sm text-destructive">{errors.buyPrice.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quantity">Quantity</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    step="0.000001"
                                    placeholder="0"
                                    {...register("quantity")}
                                />
                                {errors.quantity && (
                                    <p className="text-sm text-destructive">{errors.quantity.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="buyDate">Purchase Date</Label>
                            <Input id="buyDate" type="date" {...register("buyDate")} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="note">Note (optional)</Label>
                            <Input
                                id="note"
                                placeholder="Any details..."
                                {...register("note")}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Investment
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
