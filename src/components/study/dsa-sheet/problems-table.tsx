"use client";

import { Problem } from "@/lib/db/study";
import { ProblemRow } from "./problem-row";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProblemsTableProps {
    problems: Problem[];
}

type SortKey = keyof Problem | 'status';

export function ProblemsTable({ problems }: ProblemsTableProps) {
    const [search, setSearch] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedProblems = useMemo(() => {
        let sortableItems = [...problems];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const key = sortConfig.key;
                let aValue: any = key === 'status' ? (a.is_completed ? 1 : 0) : a[key as keyof Problem];
                let bValue: any = key === 'status' ? (b.is_completed ? 1 : 0) : b[key as keyof Problem];

                // Handle nulls
                if (aValue === null) aValue = "";
                if (bValue === null) bValue = "";

                // Difficulty Custom Sort
                if (key === 'difficulty') {
                    const map: any = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
                    aValue = map[aValue] || 99;
                    bValue = map[bValue] || 99;
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [problems, sortConfig]);

    const filtered = sortedProblems.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.companies?.toLowerCase().includes(search.toLowerCase()) ||
        p.topic_category?.toLowerCase().includes(search.toLowerCase())
    );

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortConfig?.key !== column) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-3 w-3 text-primary" /> : <ArrowDown className="ml-2 h-3 w-3 text-primary" />;
    };

    const HeaderButton = ({ column, label, className }: { column: SortKey, label: string, className?: string }) => (
        <div
            className={cn("flex items-center cursor-pointer hover:bg-muted/50 p-1 rounded select-none", className)}
            onClick={() => handleSort(column)}
        >
            {label}
            <SortIcon column={column} />
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-200px)]">
            <div className="mb-4 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search problems, companies, topics..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-card"
                />
            </div>

            <div className="border rounded-md bg-card flex-1 overflow-hidden flex flex-col">
                {/* HEADERS - Matching Grid Layout of ProblemRow */}
                <div className="overflow-x-auto min-w-full bg-muted/50 border-b">
                    <div className="grid grid-cols-12 gap-4 p-3 font-medium text-xs text-muted-foreground uppercase min-w-[900px] md:min-w-0">
                        <div className="col-span-1 text-center font-bold flex justify-center">
                            <HeaderButton column="question_number" label="#" />
                        </div>
                        <div className="col-span-3">
                            <HeaderButton column="title" label="Problem Title" />
                        </div>
                        <div className="col-span-1">
                            <HeaderButton column="difficulty" label="Diff" />
                        </div>
                        <div className="col-span-1">
                            <HeaderButton column="topic_category" label="Topic" />
                        </div>
                        <div className="col-span-2">
                            <HeaderButton column="companies" label="Companies" />
                        </div>
                        <div className="col-span-1 text-center flex justify-center">
                            <HeaderButton column="frequency_score" label="Freq" />
                        </div>
                        <div className="col-span-3 text-right pr-4">
                            Actions
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1 w-full whitespace-nowrap">
                    <div className="divide-y min-w-[900px] md:min-w-0">
                        {filtered.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                No problems found matching "{search}"
                            </div>
                        ) : (
                            filtered.map(problem => (
                                <ProblemRow key={problem.id} problem={problem} />
                            ))
                        )}
                    </div>
                </ScrollArea>

                <div className="p-2 border-t text-xs text-muted-foreground bg-muted/10 text-center sticky bottom-0 bg-background z-20">
                    Showing {filtered.length} of {problems.length} problems
                </div>
            </div>
        </div>
    );
}
