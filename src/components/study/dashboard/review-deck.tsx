"use client";

import { motion } from "framer-motion";
import { Problem } from "@/lib/db/study";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, RefreshCw, Layers } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ReviewDeckProps {
    problems: Problem[];
}

export function ReviewDeck({ problems }: ReviewDeckProps) {
    const [index, setIndex] = useState(0);

    if (!problems || problems.length === 0) {
        return (
            <Card className="h-64 flex flex-col items-center justify-center text-center p-6 border-dashed">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Layers className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-sm text-muted-foreground mt-1">No pending reviews for today.</p>
                <Link href="/study/problems/new">
                    <Button variant="outline" className="mt-4">Add New Problem</Button>
                </Link>
            </Card>
        );
    }

    const current = problems[index];
    const nextDue = new Date(current.next_review_at || Date.now()).toLocaleDateString();

    return (
        <div className="relative h-72 w-full perspective-1000">
            {/* Background Stack Effect */}
            {problems.length > 1 && (
                <div className="absolute top-2 left-2 right-2 bottom-0 bg-background border border-border shadow-sm rounded-xl -z-10 scale-[0.98] opacity-80" />
            )}
            {problems.length > 2 && (
                <div className="absolute top-4 left-4 right-4 bottom-0 bg-background border border-border shadow-sm rounded-xl -z-20 scale-[0.96] opacity-60" />
            )}

            <Card className="h-full flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow border-primary/20">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <Badge variant={current.difficulty_official === 'Hard' ? 'destructive' : current.difficulty_official === 'Medium' ? 'default' : 'secondary'}>
                            {current.difficulty_official}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">SRS Stage: {current.srs_bucket}</span>
                    </div>
                    <CardTitle className="line-clamp-2 mt-2">{current.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {current.tags_pattern?.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                        Next Review: <span className={cn("font-medium", new Date(current.next_review_at!) <= new Date() ? "text-red-500" : "")}>{nextDue}</span>
                    </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="ghost" size="sm" onClick={() => setIndex((i) => (i + 1) % problems.length)}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Skip
                    </Button>
                    <Link href={`/study/problems/${current.id}`}>
                        <Button className="w-full">
                            <Play className="mr-2 h-4 w-4" /> Start Review
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
