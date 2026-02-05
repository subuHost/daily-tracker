"use client";

import { useEffect, useState } from "react";
import { Problem } from "@/lib/db/study";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Stopwatch } from "@/components/study/problem-view/stopwatch";
import { logAttemptAction } from "@/app/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ExternalLink, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ProblemReviewPage({ params }: { params: { id: string } }) {
    const [problem, setProblem] = useState<Problem | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeTaken, setTimeTaken] = useState(0);
    const [notes, setNotes] = useState("");
    const [confidence, setConfidence] = useState([3]);
    const [submitting, setSubmitting] = useState(false);

    // UI States
    const [solutionRevealed, setSolutionRevealed] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function fetchProblem() {
            const { data, error } = await supabase.from('problems').select('*').eq('id', params.id).single();
            if (data) setProblem(data as Problem);
            setLoading(false);
        }
        fetchProblem();
    }, [params.id, supabase]);

    async function handleLogAttempt(outcome: 'Solved' | 'Failed' | 'Hint_Used') {
        if (!problem) return;
        setSubmitting(true);
        try {
            await logAttemptAction(problem.id, outcome, confidence[0], timeTaken, notes);
            toast.success("Attempt logged & SRS updated!");
            router.push("/study");
        } catch (e) {
            toast.error("Failed to save attempt");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <div className="p-8">Loading problem context...</div>;
    if (!problem) return <div className="p-8">Problem not found</div>;

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden">
            {/* LEFT PANEL: Context & Question */}
            <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r bg-muted/5">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex gap-2 mb-2">
                            <Badge variant={problem.difficulty_official === 'Hard' ? 'destructive' : 'default'}>
                                {problem.difficulty_official}
                            </Badge>
                            <Badge variant="outline">SRS Lv {problem.srs_bucket}</Badge>
                        </div>
                        <h1 className="text-2xl font-bold">{problem.title}</h1>
                    </div>
                    {problem.link && (
                        <Link href={problem.link} target="_blank">
                            <Button variant="outline" size="sm">
                                Open Platform <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    )}
                </div>

                <div className="prose dark:prose-invert max-w-none">
                    {/* Placeholder for fetching problem description if we had an API, 
                        for now relying on user opening External Link */}
                    <div className="bg-card border p-6 rounded-lg text-center my-8">
                        <p className="text-muted-foreground mb-4">
                            Solve this problem on {problem.platform || "the platform"} then log your result.
                        </p>
                        {problem.link && (
                            <Link href={problem.link} target="_blank" className="font-medium text-primary hover:underline">
                                Go to Problem Statement &rarr;
                            </Link>
                        )}
                    </div>
                </div>

                {/* Solution Reveal Logic */}
                <div className="mt-8 border-t pt-8">
                    {!solutionRevealed ? (
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => setSolutionRevealed(true)}
                        >
                            Reveal Notes / Solutions
                        </Button>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="font-semibold">My Notes & Solutions</h3>
                            <div className="bg-card p-4 rounded border min-h-[100px]">
                                {problem.video_solution_link && (
                                    <div className="mb-2">
                                        <a href={problem.video_solution_link} target="_blank" className="text-blue-500 hover:underline">Watch Video Solution</a>
                                    </div>
                                )}
                                <p className="text-sm text-muted-foreground">No comprehensive notes saved yet.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: Workspace & Logging */}
            <div className="w-full md:w-1/2 flex flex-col bg-background">
                {/* Fixed Header with Timer */}
                <div className="border-b p-4 flex justify-between items-center bg-card">
                    <span className="font-semibold text-sm text-muted-foreground">Session Timer</span>
                    <Stopwatch onTimeUpdate={setTimeTaken} />
                </div>

                {/* Editor / Scratchpad Area */}
                <div className="flex-1 overflow-y-auto p-4">
                    <Tabs defaultValue="notes" className="h-full flex flex-col">
                        <TabsList>
                            <TabsTrigger value="notes">Reflection / Notes</TabsTrigger>
                            <TabsTrigger value="code">Scratchpad</TabsTrigger>
                        </TabsList>
                        <TabsContent value="notes" className="flex-1 mt-4">
                            <Textarea
                                placeholder="What was the key intuition? Where did you get stuck?"
                                className="h-full resize-none font-sans"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </TabsContent>
                        <TabsContent value="code" className="flex-1 mt-4">
                            <Textarea
                                placeholder="// Quick scratchpad for code structure..."
                                className="h-full resize-none font-mono text-sm"
                            />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Footer: Logging Controls */}
                <div className="border-t p-6 bg-card space-y-6 shadow-up">
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <label className="text-sm font-medium">Confidence Rating: {confidence[0]}/5</label>
                            <span className="text-xs text-muted-foreground">1=Forgot, 5=Mastered</span>
                        </div>
                        <Slider
                            value={confidence}
                            onValueChange={setConfidence}
                            min={1}
                            max={5}
                            step={1}
                            className="py-2"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <Button
                            variant="destructive"
                            className="h-12 flex-col gap-1"
                            onClick={() => handleLogAttempt('Failed')}
                            disabled={submitting}
                        >
                            <XCircle className="h-5 w-5" />
                            <span className="text-xs">Failed</span>
                        </Button>
                        <Button
                            variant="secondary"
                            className="h-12 flex-col gap-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            onClick={() => handleLogAttempt('Hint_Used')}
                            disabled={submitting}
                        >
                            <HelpCircle className="h-5 w-5" />
                            <span className="text-xs">Needed Hint</span>
                        </Button>
                        <Button
                            className="h-12 flex-col gap-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleLogAttempt('Solved')}
                            disabled={submitting}
                        >
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="text-xs">Solved</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
