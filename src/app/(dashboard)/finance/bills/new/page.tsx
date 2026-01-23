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
import { createBill, uploadGalleryFile } from "@/lib/db";
import { Upload, X } from "lucide-react";

const billSchema = z.object({
    name: z.string().min(1, "Bill name is required"),
    amount: z.string().min(1, "Amount is required"),
    dueDate: z.string().min(1, "Due date is required"),
    recurring: z.string().min(1, "Frequency is required"),
    note: z.string().optional(),
});

type BillForm = z.infer<typeof billSchema>;

export default function NewBillPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<BillForm>({
        resolver: zodResolver(billSchema),
        defaultValues: {
            recurring: "monthly",
        },
    });

    const onSubmit = async (data: BillForm) => {
        setIsLoading(true);
        try {
            let imageUrl = null;
            if (file) {
                // Upload image first
                const galleryItem = await uploadGalleryFile(file, `Bill: ${data.name}`, ["bill", "receipt"]);
                imageUrl = galleryItem.file_url;
            }

            await createBill({
                name: data.name,
                amount: parseFloat(data.amount),
                due_date: parseInt(data.dueDate),
                recurring: data.recurring as "monthly" | "yearly" | "weekly",
                note: data.note || null,
                image_url: imageUrl,
            });
            toast.success("Bill added successfully!");
            router.push("/finance/bills");
        } catch (error: any) {
            console.error("Failed to add bill:", error);
            toast.error(`Failed to add bill: ${error.message || "Unknown error"}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/finance/bills">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Add Bill</h1>
                    <p className="text-muted-foreground">Track recurring payments</p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Bill Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Electricity, Internet, Rent"
                                {...register("name")}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₹)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0"
                                {...register("amount")}
                            />
                            {errors.amount && (
                                <p className="text-sm text-destructive">{errors.amount.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Day (1-31)</Label>
                            <Input
                                id="dueDate"
                                type="number"
                                min="1"
                                max="31"
                                placeholder="e.g., 15"
                                {...register("dueDate")}
                            />
                            {errors.dueDate && (
                                <p className="text-sm text-destructive">{errors.dueDate.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="recurring">Frequency</Label>
                            <Select
                                defaultValue="monthly"
                                onValueChange={(value) => setValue("recurring", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Receipt / Attachment (Optional)</Label>
                            {!file ? (
                                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 hover:bg-accent/50 transition-colors">
                                    <Input
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        id="bill-file"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setFile(e.target.files[0]);
                                            }
                                        }}
                                    />
                                    <Label htmlFor="bill-file" className="cursor-pointer block">
                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        <span className="text-sm text-muted-foreground">
                                            Click to upload receipt
                                        </span>
                                    </Label>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 p-2 border rounded-md">
                                    <span className="text-sm truncate flex-1">{file.name}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFile(null)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
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
                            Add Bill
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
