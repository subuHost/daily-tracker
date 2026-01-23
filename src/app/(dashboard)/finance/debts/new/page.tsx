"use client";

import { useState, useEffect } from "react";
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
import { createDebt, getContacts, type Contact } from "@/lib/db";

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

export default function NewDebtPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [contacts, setContacts] = useState<Contact[]>([]);

    useEffect(() => {
        async function loadContacts() {
            try {
                const data = await getContacts();
                setContacts(data);
            } catch (error) {
                console.error("Failed to load contacts:", error);
            }
        }
        loadContacts();
    }, []);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<DebtForm>({
        resolver: zodResolver(debtSchema),
        defaultValues: {
            date: new Date().toISOString().split("T")[0],
            type: "lend",
        },
    });

    const onSubmit = async (data: DebtForm) => {
        setIsLoading(true);
        try {
            await createDebt({
                person: data.person,
                amount: parseFloat(data.amount),
                type: data.type as "lend" | "borrow",
                date: data.date,
                due_date: data.dueDate || null,
                note: data.note || null,
                contact_id: data.contactId || null,
            });
            toast.success("Debt recorded successfully!");
            router.push("/finance/debts");
        } catch (error) {
            console.error("Failed to add debt:", error);
            toast.error("Failed to add debt. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

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
                    <h1 className="text-2xl font-bold tracking-tight">Add Debt</h1>
                    <p className="text-muted-foreground">Record money lent or borrowed</p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                defaultValue="lend"
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
                            {errors.type && (
                                <p className="text-sm text-destructive">{errors.type.message}</p>
                            )}
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
                            <Select onValueChange={(value) => setValue("contactId", value === "none" ? "" : value)}>
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
                                Link to track total debts per person
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

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Debt
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
