"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2 } from "lucide-react";
import { updateEvent, deleteEvent, type Event } from "@/lib/db";
import { toast } from "sonner";

interface EditEventDialogProps {
    event: Event | null;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditEventDialog({
    event,
    onOpenChange,
    onSuccess,
}: EditEventDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [type, setType] = useState<"meeting" | "function" | "birthday" | "other">("meeting");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");

    useEffect(() => {
        if (event) {
            setTitle(event.title);
            setType(event.type);
            setDescription(event.description || "");
            setDate(event.date);
        }
    }, [event]);

    if (!event) return null;

    const handleUpdate = async () => {
        if (!title) return toast.error("Title is required");
        setIsLoading(true);
        try {
            await updateEvent(event.id, {
                title,
                type,
                description: description || null,
                date,
            });
            toast.success("Event updated");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update event");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this event?")) return;
        setIsLoading(true);
        try {
            await deleteEvent(event.id);
            toast.success("Event deleted");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete event");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={!!event} onOpenChange={(open) => !open && onOpenChange(false)}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Event Title</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <div className="flex bg-muted p-1 rounded-md flex-wrap">
                            {["meeting", "function", "birthday", "other"].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setType(t as any)}
                                    className={`flex-1 text-xs py-1.5 px-2 rounded-sm capitalize transition-all ${type === t ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[80px]"
                        />
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Delete
                    </Button>
                    <Button onClick={handleUpdate} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
