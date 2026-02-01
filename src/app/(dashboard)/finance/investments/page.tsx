"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Loader2,
    TrendingUp,
    TrendingDown,
    LineChart,
    MoreVertical,
    Edit2,
    Trash2,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { getInvestments, getInvestmentSummary, updateInvestment, deleteInvestment, type Investment } from "@/lib/db";
import { toast } from "sonner";

export default function InvestmentsPage() {
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [summary, setSummary] = useState({ totalInvested: 0, currentValue: 0, totalGain: 0, gainPercent: 0 });
    const [isLoading, setIsLoading] = useState(true);

    // Edit state
    const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        symbol: "",
        name: "",
        buy_price: 0,
        quantity: 0,
        current_price: 0,
        type: "stock" as "stock" | "crypto" | "mutual_fund" | "other",
    });
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        async function loadInvestments() {
            try {
                const [data, summaryData] = await Promise.all([
                    getInvestments(),
                    getInvestmentSummary(),
                ]);
                setInvestments(data);
                setSummary(summaryData);
            } catch (error) {
                console.error("Failed to load investments:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadInvestments();
    }, []);

    const handleEditClick = (investment: Investment) => {
        setEditingInvestment(investment);
        setEditForm({
            symbol: investment.symbol,
            name: investment.name || "",
            buy_price: Number(investment.buy_price),
            quantity: Number(investment.quantity),
            current_price: Number(investment.current_price || investment.buy_price),
            type: investment.type,
        });
        setIsEditOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingInvestment) return;
        setIsActionLoading(true);
        try {
            await updateInvestment(editingInvestment.id, {
                symbol: editForm.symbol,
                name: editForm.name || null,
                buy_price: editForm.buy_price,
                quantity: editForm.quantity,
                current_price: editForm.current_price,
                type: editForm.type,
            });

            // Update local state
            setInvestments(investments.map(inv =>
                inv.id === editingInvestment.id
                    ? { ...inv, ...editForm, name: editForm.name || null }
                    : inv
            ));

            // Recalculate summary
            const newSummary = await getInvestmentSummary();
            setSummary(newSummary);

            setIsEditOpen(false);
            toast.success("Investment updated");
        } catch (error) {
            console.error("Update failed:", error);
            toast.error("Failed to update investment");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this investment?")) return;

        try {
            await deleteInvestment(id);
            setInvestments(investments.filter(inv => inv.id !== id));

            // Recalculate summary
            const newSummary = await getInvestmentSummary();
            setSummary(newSummary);

            toast.success("Investment deleted");
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete investment");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Investments</h1>
                    <p className="text-muted-foreground text-sm">
                        Track your portfolio
                    </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/finance/investments/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Investment
                    </Link>
                </Button>
            </div>

            {/* Summary Cards */}
            {investments.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Invested</p>
                            <p className="text-2xl font-bold">{formatCurrency(summary.totalInvested)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Current Value</p>
                            <p className="text-2xl font-bold">{formatCurrency(summary.currentValue)}</p>
                        </CardContent>
                    </Card>
                    <Card className={summary.totalGain >= 0 ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
                            <p className={`text-2xl font-bold ${summary.totalGain >= 0 ? "text-green-600" : "text-red-500"}`}>
                                {summary.totalGain >= 0 ? "+" : ""}{formatCurrency(summary.totalGain)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Returns</p>
                            <p className={`text-2xl font-bold ${summary.gainPercent >= 0 ? "text-green-600" : "text-red-500"}`}>
                                {summary.gainPercent >= 0 ? "+" : ""}{summary.gainPercent.toFixed(2)}%
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Investments List */}
            {investments.length > 0 ? (
                <div className="space-y-3">
                    {investments.map((investment) => {
                        const invested = Number(investment.buy_price) * Number(investment.quantity);
                        const current = (investment.current_price || investment.buy_price) * Number(investment.quantity);
                        const gain = current - invested;
                        const gainPercent = ((current - invested) / invested) * 100;

                        return (
                            <Card key={investment.id} className="hover:bg-accent/50 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${gain >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                                                {gain >= 0 ? (
                                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{investment.symbol}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {investment.name || investment.type} • {Number(investment.quantity)} units
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <p className="font-semibold">{formatCurrency(current)}</p>
                                                <p className={`text-sm ${gain >= 0 ? "text-green-600" : "text-red-500"}`}>
                                                    {gain >= 0 ? "+" : ""}{formatCurrency(gain)} ({gainPercent.toFixed(1)}%)
                                                </p>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEditClick(investment)}>
                                                        <Edit2 className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(investment.id)} className="text-destructive focus:text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <LineChart className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No investments yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Start tracking your stocks, crypto, and mutual funds.
                    </p>
                    <Button asChild>
                        <Link href="/finance/investments/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add First Investment
                        </Link>
                    </Button>
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Investment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Symbol</Label>
                                <Input
                                    value={editForm.symbol}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                                    placeholder="e.g., RELIANCE"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={editForm.type}
                                    onValueChange={(value: typeof editForm.type) => setEditForm(prev => ({ ...prev, type: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="stock">Stock</SelectItem>
                                        <SelectItem value="crypto">Crypto</SelectItem>
                                        <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Name (optional)</Label>
                            <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Reliance Industries"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Buy Price</Label>
                                <Input
                                    type="number"
                                    value={editForm.buy_price}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, buy_price: Number(e.target.value) }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Quantity</Label>
                                <Input
                                    type="number"
                                    value={editForm.quantity}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Current Price</Label>
                            <Input
                                type="number"
                                value={editForm.current_price}
                                onChange={(e) => setEditForm(prev => ({ ...prev, current_price: Number(e.target.value) }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isActionLoading}>Cancel</Button>
                        <Button onClick={handleUpdate} disabled={isActionLoading}>
                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

