"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    CalendarIcon,
    CheckSquare,
    Gift,
    BookOpen,
    Loader2
} from "lucide-react";
import { createEvent, createTask, createContact, saveDailyEntry, getDailyEntry } from "@/lib/db";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AddItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedDate: Date | null;
    onSuccess: () => void;
}

export function CalendarAddItemDialog({
    open,
    onOpenChange,
    selectedDate,
    onSuccess,
}: AddItemDialogProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("event");
    const [isLoading, setIsLoading] = useState(false);

    // Event State
    const [eventTitle, setEventTitle] = useState("");
    const [eventType, setEventType] = useState<"meeting" | "function" | "birthday" | "other">("meeting");

    // Task State
    const [taskTitle, setTaskTitle] = useState("");
    const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");

    // Birthday (Contact) State
    const [contactName, setContactName] = useState("");

    // Note (Journal) State
    const [noteContent, setNoteContent] = useState("");

    if (!selectedDate) return null;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const displayDate = format(selectedDate, "MMMM d, yyyy");

    const resetForms = () => {
        setEventTitle("");
        setEventType("meeting");
        setTaskTitle("");
        setTaskPriority("medium");
        setContactName("");
        setNoteContent("");
    };

    const handleCreateEvent = async () => {
        if (!eventTitle) return toast.error("Title is required");
        setIsLoading(true);
        try {
            await createEvent({
                title: eventTitle,
                date: dateStr,
                type: eventType,
                description: "Created from Calendar",
            });
            toast.success("Event created");
            onSuccess();
            onOpenChange(false);
            resetForms();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create event");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTask = async () => {
        if (!taskTitle) return toast.error("Title is required");
        setIsLoading(true);
        try {
            await createTask({
                title: taskTitle,
                due_date: dateStr,
                priority: taskPriority,
            });
            toast.success("Task created");
            onSuccess();
            onOpenChange(false);
            resetForms();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create task");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBirthday = async () => {
        if (!contactName) return toast.error("Name is required");
        setIsLoading(true);
        try {
            // Create contact with birthday set to selected date
            await createContact({
                name: contactName,
                birthday: dateStr,
                notes: "Created from Calendar",
            });

            // Also optionally create a calendar event for visibility? 
            // The calendar page logic likely pulls birthdays from contacts, but explicit event is also fine.
            // For now, let's Stick to the requested requirement: "birthday added from the calender, should also get updated in the contact data"
            // This implies the PRIMARY action is creating a contact data.

            toast.success("Birthday added (Contact created)");
            onSuccess();
            onOpenChange(false);
            resetForms();
        } catch (error) {
            console.error(error);
            toast.error("Failed to add birthday");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!noteContent) return toast.error("Note is required");
        setIsLoading(true);
        try {
            // First check existing entry to preserve other fields
            const existing = await getDailyEntry(dateStr);

            await saveDailyEntry({
                date: dateStr,
                notes: existing?.notes ? `${existing.notes}\n\n${noteContent}` : noteContent,
                // Preserve other fields if they exist
                studied: existing?.studied,
                gym_done: existing?.gym_done,
                gym_notes: existing?.gym_notes,
                mood: existing?.mood,
            });

            toast.success("Journal note added");
            onSuccess();
            onOpenChange(false);
            resetForms();
        } catch (error) {
            console.error(error);
            toast.error("Failed to add note");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add to {displayDate}</DialogTitle>
                </DialogHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 h-auto min-h-10">
                        <TabsTrigger value="event" title="Event" className="text-xs sm:text-sm"><CalendarIcon className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Event</span></TabsTrigger>
                        <TabsTrigger value="task" title="Task" className="text-xs sm:text-sm"><CheckSquare className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Task</span></TabsTrigger>
                        <TabsTrigger value="birthday" title="Birthday" className="text-xs sm:text-sm"><Gift className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">B-Day</span></TabsTrigger>
                        <TabsTrigger value="note" title="Note" className="text-xs sm:text-sm"><BookOpen className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Note</span></TabsTrigger>
                    </TabsList>

                    {/* Event Tab */}
                    <TabsContent value="event" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Event Title</Label>
                            <Input
                                placeholder="Meeting, Party, etc."
                                value={eventTitle}
                                onChange={(e) => setEventTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <div className="flex bg-muted p-1 rounded-md flex-wrap gap-1">
                                {["meeting", "function", "other"].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setEventType(type as any)}
                                        className={`flex-1 min-w-[70px] text-xs py-1.5 px-2 rounded-sm capitalize transition-all ${eventType === type ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Button onClick={handleCreateEvent} disabled={isLoading} className="w-full">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Event
                        </Button>
                    </TabsContent>

                    {/* Task Tab */}
                    <TabsContent value="task" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Task Title</Label>
                            <Input
                                placeholder="Buy groceries, Call mom..."
                                value={taskTitle}
                                onChange={(e) => setTaskTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <div className="flex gap-2">
                                {["low", "medium", "high"].map((p) => (
                                    <Button
                                        key={p}
                                        variant={taskPriority === p ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setTaskPriority(p as any)}
                                        className="capitalize flex-1"
                                    >
                                        {p}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <Button onClick={handleCreateTask} disabled={isLoading} className="w-full">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Task
                        </Button>
                    </TabsContent>

                    {/* Birthday Tab */}
                    <TabsContent value="birthday" className="space-y-4 pt-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-sm rounded-md mb-2">
                            This will create a new contact with their birthday set to {format(selectedDate, "MMMM d")}.
                        </div>
                        <div className="space-y-2">
                            <Label>Person's Name</Label>
                            <Input
                                placeholder="John Doe"
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleCreateBirthday} disabled={isLoading} className="w-full">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Birthday Contact
                        </Button>
                    </TabsContent>

                    {/* Note Tab */}
                    <TabsContent value="note" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Journal Note</Label>
                            <Textarea
                                placeholder="Add a quick note to your daily journal..."
                                className="min-h-[100px]"
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleAddNote} disabled={isLoading} className="w-full">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add to Journal
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
