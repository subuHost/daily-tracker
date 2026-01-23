"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { getDebts, updateDebt, getContacts, type Debt, type Contact } from "@/lib/db";

const debtSchema = z.object({
    person: z.string().min(1, "Person name is required"),
    amount: z.string().min(1, "Amount is required"),
    type: z.string().min(1, "Type is required"),
    date: z.string().min(1, "Date is required"),
    dueDate: z.string().optional(),
    note: z.string().optional(),
    contactId: z.string().optional(),
});

type DebtForm = z.infer<typeof debtSchema>;

export default function EditDebtPage() {
    const router = useRouter();
    const params = useParams();
    const debtId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [debt, setDebt] = useState<Debt | null>(null);
    const [contacts, setContacts] = useState<Contact[]>([]);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<DebtForm>({
        resolver: zodResolver(debtSchema),
    });

    useEffect(() => {
        async function loadData() {
            try {
                const [debts, contactsList] = await Promise.all([
                    getDebts(),
                    getContacts(),
                ]);
                const foundDebt = debts.find(d => d.id === debtId);
                if (foundDebt) {
                    setDebt(foundDebt);
                    setValue("person", foundDebt.person);
                    setValue("amount", String(foundDebt.amount));
                    setValue("type", foundDebt.type);
                    setValue("date", foundDebt.date);
                    setValue("dueDate", foundDebt.due_date || "");
                    setValue("note", foundDebt.note || "");
                    setValue("contactId", foundDebt.contact_id || "");
                }
                setContacts(contactsList);
            } catch (error) {
                console.error("Failed to load debt:", error);
                toast.error("Failed to load debt");
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [debtId, setValue]);

    const onSubmit = async (data: DebtForm) => {
        setIsSaving(true);
        try {
            await updateDebt(debtId, {
                person: data.person,
                amount: parseFloat(data.amount),
                type: data.type as "lend" | "borrow",
                date: data.date,
                due_date: data.dueDate || null,
                note: data.note || null,
                contact_id: data.contactId || null,
            });
            toast.success("Debt updated successfully!");
            router.push("/finance/debts");
        } catch (error) {
            console.error("Failed to update debt:", error);
            toast.error("Failed to update debt. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!debt) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">Debt not found</p>
                <Button asChild className="mt-4">
                    <Link href="/finance/debts">Back to Debts</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/finance/debts">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Debt</h1>
                    <p className="text-muted-foreground">Update debt details</p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                defaultValue={debt.type}
                                onValueChange={(value) => setValue("type", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lend">I Lent (someone owes me)</SelectItem>
                                    <SelectItem value="borrow">I Borrowed (I owe someone)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="person">Person Name</Label>
                            <Input
                                id="person"
                                placeholder="Who?"
                                {...register("person")}
                            />
                            {errors.person && (
                                <p className="text-sm text-destructive">{errors.person.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contactId">Link to Contact (optional)</Label>
                            <Select
                                defaultValue={debt.contact_id || ""}
                                onValueChange={(value) => setValue("contactId", value === "none" ? "" : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a contact" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No contact linked</SelectItem>
                                    {contacts.map((contact) => (
                                        <SelectItem key={contact.id} value={contact.id}>
                                            {contact.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Link this debt to a contact to track total debts per person
                            </p>
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
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" type="date" {...register("date")} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date (optional)</Label>
                            <Input id="dueDate" type="date" {...register("dueDate")} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="note">Note (optional)</Label>
                            <Input
                                id="note"
                                placeholder="Any details..."
                                {...register("note")}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Debt
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
