"use client";

import { useState } from "react";
import { Problem } from "@/lib/db/study";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Youtube, FileText, Trash2 } from "lucide-react";
import { toggleProblemCompletionAction, deleteProblemAction } from "@/app/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { EditProblemDialog } from "./edit-problem-dialog";

interface ProblemRowProps {
    problem: Problem;
}

export function ProblemRow({ problem }: ProblemRowProps) {
    const [completed, setCompleted] = useState(problem.is_completed);

    const handleToggle = async (checked: boolean) => {
        setCompleted(checked);
        try {
            await toggleProblemCompletionAction(problem.id, checked);
            if (checked) {
                toast.success("Marked as completed");
            }
        } catch (e) {
            setCompleted(!checked); // Revert
            toast.error("Failed to update status");
        }
    };
    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this problem?")) return;
        try {
            await deleteProblemAction(problem.id);
            toast.success("Problem deleted");
        } catch (e) {
            toast.error("Failed to delete problem");
        }
    };

    const getDifficultyColor = (diff: string | null) => {
        const d = diff?.toLowerCase() || '';
        if (d.includes('easy')) return 'text-green-600 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800';
        if (d.includes('medium')) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
        if (d.includes('hard')) return 'text-red-600 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
        return 'text-muted-foreground bg-muted border-transparent';
    };

    return (
        <div className={cn(
            "grid grid-cols-12 gap-4 p-3 items-center hover:bg-muted/50 transition-colors border-b last:border-0 min-w-[900px] md:min-w-0 group",
            completed ? "bg-primary/5" : ""
        )}>
            {/* 1. STATUS & NUMBER */}
            <div className="col-span-1 flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground font-mono w-6 text-right inline-block">
                    {problem.question_number ?? "-"}
                </span>
                <div title={completed && problem.completion_date ? `Completed on ${new Date(problem.completion_date).toLocaleDateString()}` : "Mark as complete"}>
                    <Checkbox
                        checked={completed}
                        onCheckedChange={(checked) => handleToggle(checked as boolean)}
                    />
                </div>
            </div>

            {/* 2. TITLE */}
            <div className="col-span-3 flex flex-col justify-center overflow-hidden">
                <Link href={`/study/problems/${problem.id}`} className="hover:underline hover:text-primary transition-colors font-medium text-sm truncate" title={problem.title}>
                    {problem.title}
                </Link>
                {/* Mobile/Compact View for diff/companies if needed */}
                {completed && problem.completion_date && (
                    <span className="text-[10px] text-muted-foreground hidden md:block">
                        Done: {new Date(problem.completion_date).toLocaleDateString()}
                    </span>
                )}
            </div>

            {/* 3. DIFFICULTY */}
            <div className="col-span-1 flex items-center">
                <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium border text-center min-w-[60px]", getDifficultyColor(problem.difficulty))}>
                    {problem.difficulty || "Medium"}
                </span>
            </div>

            {/* 4. TOPIC */}
            <div className="col-span-1 flex items-center">
                <span className="text-xs text-muted-foreground truncate" title={problem.topic_category || ""}>
                    {problem.topic_category || "-"}
                </span>
            </div>

            {/* 5. COMPANIES */}
            <div className="col-span-2 flex items-center overflow-hidden">
                {problem.companies ? (
                    <div className="flex flex-wrap gap-1 h-5 overflow-hidden">
                        {problem.companies.split(',').slice(0, 3).map((c, i) => (
                            <Badge key={i} variant="outline" className="text-[9px] h-4 px-1 rounded-sm font-normal text-muted-foreground border-muted-foreground/30 whitespace-nowrap">
                                {c.trim()}
                            </Badge>
                        ))}
                    </div>
                ) : <span className="text-xs text-muted-foreground">-</span>}
            </div>

            {/* 6. FREQ */}
            <div className="col-span-1 text-center">
                <span className="text-xs text-muted-foreground font-mono">
                    {problem.frequency_score ? problem.frequency_score : "-"}
                </span>
            </div>

            {/* 7. ACTIONS */}
            <div className="col-span-3 flex justify-end gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <EditProblemDialog problem={problem} />

                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500/50 hover:text-red-500 hover:bg-red-50" onClick={handleDelete} title="Delete Problem">
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>

                {problem.link_gfg && (
                    <Link href={problem.link_gfg} target="_blank">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-700/70 hover:text-green-700 hover:bg-green-50" title="GeeksForGeeks Link">
                            <span className="font-bold text-[10px]">GFG</span>
                        </Button>
                    </Link>
                )}
                {problem.link && (
                    <Link href={problem.link} target="_blank">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-500/70 hover:text-orange-500 hover:bg-orange-50" title="LeetCode Link">
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                )}
                {/* Notes Indicator */}
                {problem.comment && (
                    <div title={problem.comment}>
                        <FileText className="h-3.5 w-3.5 text-blue-500/50" />
                    </div>
                )}
            </div>
        </div>
    );
}
