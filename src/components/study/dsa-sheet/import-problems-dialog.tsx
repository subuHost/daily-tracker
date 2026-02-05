"use client";
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
import { importProblemsAction } from "@/app/actions";
import { useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ImportProblemsDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            await importProblemsAction(formData);
            toast.success("Problems imported successfully");
            setOpen(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to import. Check CSV format.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <FileSpreadsheet className="h-4 w-4" /> Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Import Problems</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to add multiple problems at once.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted p-3 rounded-md text-xs font-mono mb-4 text-muted-foreground">
                    <p className="font-bold mb-1">Expected CSV Format (8 columns):</p>
                    number, title, difficulty, leetcode_link, gfg_link, topic, companies, frequency
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="file">CSV File</Label>
                        <Input id="file" name="file" type="file" accept=".csv" required />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Importing..." : "Upload & Import"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
