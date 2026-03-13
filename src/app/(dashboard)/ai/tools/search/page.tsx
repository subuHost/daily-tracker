"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, ExternalLink, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AiHubNav } from "@/components/ai/ai-hub-nav";
import { webSearchToolAction } from "@/app/actions/ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type PerplexityModel = "sonar" | "sonar-pro" | "sonar-reasoning";

const MODEL_LABELS: Record<PerplexityModel, string> = {
    sonar: "Sonar (Fast)",
    "sonar-pro": "Sonar Pro",
    "sonar-reasoning": "Sonar Reasoning",
};

const RECENT_KEY = "ai_search_recent";
const MAX_RECENT = 8;

interface SearchResult {
    query: string;
    content: string;
    citations: string[];
    timestamp: number;
    model: PerplexityModel;
}

export default function WebSearchPage() {
    const [query, setQuery] = useState("");
    const [model, setModel] = useState<PerplexityModel>("sonar");
    const [result, setResult] = useState<SearchResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENT_KEY);
            if (stored) setRecentSearches(JSON.parse(stored));
        } catch { /* ignore */ }
        inputRef.current?.focus();
    }, []);

    const saveRecent = (q: string) => {
        const updated = [q, ...recentSearches.filter((r) => r !== q)].slice(0, MAX_RECENT);
        setRecentSearches(updated);
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    };

    const handleSearch = async (q = query) => {
        if (!q.trim() || isSearching) return;
        setIsSearching(true);
        setResult(null);
        try {
            const res = await webSearchToolAction(q.trim(), model);
            setResult({ ...res, timestamp: Date.now(), model });
            saveRecent(q.trim());
        } catch {
            setResult({ query: q, content: "Search failed. Please try again.", citations: [], timestamp: Date.now(), model });
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="flex h-full overflow-hidden">
            {/* AI Hub Nav Sidebar */}
            <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-card">
                <AiHubNav />
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-xl font-semibold">Web Search</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Search the web with AI — powered by Perplexity
                        </p>
                    </div>

                    {/* Search Bar */}
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
                        className="flex gap-2"
                    >
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ask anything..."
                                className="pl-10 h-11 text-sm"
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-11 gap-1.5 text-xs shrink-0">
                                    {MODEL_LABELS[model]}
                                    <ChevronDown className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {(Object.keys(MODEL_LABELS) as PerplexityModel[]).map((m) => (
                                    <DropdownMenuItem key={m} onClick={() => setModel(m)} className="text-xs">
                                        {MODEL_LABELS[m]}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button type="submit" disabled={!query.trim() || isSearching} className="h-11 px-5">
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </form>

                    {/* Recent Searches */}
                    {recentSearches.length > 0 && !result && !isSearching && (
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Recent
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {recentSearches.map((r, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setQuery(r); handleSearch(r); }}
                                        className="text-xs bg-muted hover:bg-accent px-3 py-1.5 rounded-full transition-colors"
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading state */}
                    {isSearching && (
                        <div className="flex items-center gap-3 py-12 justify-center text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span className="text-sm">Searching the web...</span>
                        </div>
                    )}

                    {/* Results */}
                    {result && !isSearching && (
                        <div className="space-y-4">
                            {/* Result meta */}
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                    Results for:{" "}
                                    <span className="font-medium text-foreground">&quot;{result.query}&quot;</span>
                                </p>
                                <Badge variant="secondary" className="text-[10px]">
                                    {MODEL_LABELS[result.model]}
                                </Badge>
                            </div>

                            {/* Content */}
                            <div className="prose dark:prose-invert prose-sm max-w-none text-sm leading-relaxed bg-card border rounded-xl p-5">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {result.content}
                                </ReactMarkdown>
                            </div>

                            {/* Citations */}
                            {result.citations.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                        Sources
                                    </p>
                                    <div className="space-y-1.5">
                                        {result.citations.map((url, i) => {
                                            let hostname = url;
                                            try { hostname = new URL(url).hostname.replace("www.", ""); } catch { /* ignore */ }
                                            return (
                                                <a
                                                    key={i}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                                                >
                                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                                    <span>[{i + 1}] {hostname}</span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Empty state */}
                    {!result && !isSearching && recentSearches.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-emerald-500/10 scale-[2.5] animate-pulse" />
                                <div className="relative w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <Search className="h-7 w-7 text-emerald-500/60" />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Search anything</p>
                                <p className="text-xs mt-1 max-w-xs">
                                    Ask questions, research topics, get up-to-date information powered by Perplexity AI.
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                                {["Latest AI news", "How does TypeScript work?", "Best productivity tips"].map((hint) => (
                                    <button
                                        key={hint}
                                        onClick={() => { setQuery(hint); handleSearch(hint); }}
                                        className="text-xs bg-muted hover:bg-accent px-3 py-1.5 rounded-full transition-colors"
                                    >
                                        {hint}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
