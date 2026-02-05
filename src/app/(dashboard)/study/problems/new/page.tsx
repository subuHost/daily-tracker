import { createProblemAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewProblemPage() {
    return (
        <div className="max-w-2xl mx-auto p-8">
            <h1 className="text-2xl font-bold mb-6">Log New Problem</h1>
            <form action={createProblemAction} className="space-y-6 bg-card p-6 border rounded-xl">
                <div className="space-y-2">
                    <Label>Problem Title / Question</Label>
                    <Input name="title" placeholder="e.g. Reverse Linked List" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Topic Categories</Label>
                        <Input name="topic" placeholder="e.g. Arrays, DP (comma sorted)" />
                    </div>
                    <div className="space-y-2">
                        <Label>Difficulty</Label>
                        <select name="difficulty" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>LeetCode Link</Label>
                        <Input name="link" placeholder="https://leetcode.com/..." />
                    </div>
                    <div className="space-y-2">
                        <Label>GFG Link</Label>
                        <Input name="link_gfg" placeholder="https://geeksforgeeks.org/..." />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Companies</Label>
                    <Input name="companies" placeholder="e.g. Google, Amazon, Microsoft" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Frequency Score</Label>
                        <Input name="frequency_score" type="number" placeholder="0" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Notes / Comments</Label>
                    <Textarea name="comment" placeholder="Any specific initial notes?" />
                </div>

                <Button type="submit" className="w-full">Save to Library</Button>
            </form>
        </div>
    );
}
