"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Problem } from "@/lib/db/study";
import { updateProblemAction } from "@/app/actions";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

interface EditProblemDialogProps {
    problem: Problem;
}

export function EditProblemDialog({ problem }: EditProblemDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            await updateProblemAction(problem.id, formData);
            toast.success("Problem updated");
            setOpen(false);
        } catch (e) {
            toast.error("Failed to update problem");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Problem</DialogTitle>
                    <DialogDescription>
                        Update problem details.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">
                                Title
                            </Label>
                            <Input
                                id="title"
                                name="title"
                                defaultValue={problem.title}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="topic" className="text-right">
                                Topic
                            </Label>
                            <Input
                                id="topic"
                                name="topic"
                                defaultValue={problem.topic_category || ""}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="difficulty" className="text-right">
                                Difficulty
                            </Label>
                            <Input
                                id="difficulty"
                                name="difficulty"
                                defaultValue={problem.difficulty || ""}
                                className="col-span-3"
                                placeholder="Easy, Medium, Hard"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="companies" className="text-right">
                                Companies
                            </Label>
                            <Input
                                id="companies"
                                name="companies"
                                defaultValue={problem.companies || ""}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="link" className="text-right">
                                LeetCode
                            </Label>
                            <Input
                                id="link"
                                name="link"
                                defaultValue={problem.link || ""}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="link_gfg" className="text-right">GFG Link</Label>
                            <Input id="link_gfg" name="link_gfg" defaultValue={problem.link_gfg || ""} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="frequency_score" className="text-right">Freq. Score</Label>
                            <Input id="frequency_score" name="frequency_score" type="number" defaultValue={problem.frequency_score || 0} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="comment" className="text-right">Comment</Label>
                            <Input id="comment" name="comment" defaultValue={problem.comment || ""} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
