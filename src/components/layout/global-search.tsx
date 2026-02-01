"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "../ui/command";
import { Search, Calculator, Calendar, User, ShoppingBag, Loader2 } from "lucide-react";
import { globalSearch, type SearchResult } from "@/app/actions/search";
import { useDebounce } from "@/hooks/use-debounce";

export function GlobalSearch() {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const debouncedQuery = useDebounce(query, 300);
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    React.useEffect(() => {
        if (debouncedQuery.length < 2) {
            setResults([]);
            return;
        }

        const fetchResults = async () => {
            setIsLoading(true);
            try {
                const data = await globalSearch(debouncedQuery);
                setResults(data);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery]);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, []);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="relative inline-flex items-center justify-start h-9 px-4 py-2 text-sm font-medium transition-colors border rounded-md border-input bg-background hover:bg-accent hover:text-accent-foreground w-full sm:w-64 lg:w-80 group"
            >
                <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="inline-flex text-muted-foreground">Search...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Type to search tasks, food, contacts..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    <CommandEmpty>
                        {isLoading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Searching...
                            </div>
                        ) : (
                            "No results found."
                        )}
                    </CommandEmpty>

                    {results.length > 0 && (
                        <>
                            <CommandGroup heading="Results">
                                {results.map((result) => (
                                    <CommandItem
                                        key={`${result.type}-${result.id}`}
                                        value={result.title}
                                        onSelect={() => {
                                            runCommand(() => router.push(result.url));
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            {result.type === "task" && <Calculator className="w-4 h-4" />}
                                            {result.type === "food" && <Calculator className="w-4 h-4 text-orange-500" />}
                                            {result.type === "contact" && <User className="w-4 h-4 text-blue-500" />}
                                            {result.type === "shopping" && <ShoppingBag className="w-4 h-4 text-purple-500" />}
                                            <div className="flex flex-col">
                                                <span>{result.title}</span>
                                                {result.description && (
                                                    <span className="text-xs text-muted-foreground line-clamp-1">
                                                        {result.description}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </>
                    )}

                    <CommandSeparator />
                    <CommandGroup heading="Quick Links">
                        <CommandItem onSelect={() => runCommand(() => router.push("/tasks"))}>
                            <Calendar className="w-4 h-4 mr-2" />
                            Tasks
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/health"))}>
                            <Calculator className="w-4 h-4 mr-2" />
                            Health Tracker
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/shopping"))}>
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Shopping List
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}
