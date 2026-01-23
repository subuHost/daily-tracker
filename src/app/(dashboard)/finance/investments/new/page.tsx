"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";

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

export default function NewInvestmentPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<InvestmentForm>({
        resolver: zodResolver(investmentSchema),
        defaultValues: {
            buyDate: new Date().toISOString().split("T")[0],
            type: "stock",
        },
    });

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

                        <div className="space-y-2">
                            <Label htmlFor="symbol">Symbol / Ticker</Label>
                            <Input
                                id="symbol"
                                placeholder="e.g., RELIANCE, BTC, HDFC MF"
                                {...register("symbol")}
                            />
                            {errors.symbol && (
                                <p className="text-sm text-destructive">{errors.symbol.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Name (optional)</Label>
                            <Input
                                id="name"
                                placeholder="Full name of the investment"
                                {...register("name")}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="buyPrice">Buy Price (₹)</Label>
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
