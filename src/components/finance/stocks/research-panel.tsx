"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Brain,
    Loader2,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    Zap,
    ExternalLink,
} from "lucide-react";
import { generateStockResearch, type ResearchReport } from "@/app/actions/stocks";
import { ModelOption } from "@/lib/ai/model-router";

interface ResearchPanelProps {
    symbol: string;
    companyName?: string;
    availableModels?: ModelOption[];
}

export function ResearchPanel({ symbol, companyName, availableModels = [] }: ResearchPanelProps) {
    const [report, setReport] = useState<ResearchReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string>("gemini-flash");

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateStockResearch(symbol, companyName, selectedModel);
            setReport(result);
        } catch (err) {
            setError("Failed to generate research report. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const sentimentConfig = {
        bullish: {
            icon: TrendingUp,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            label: "Bullish",
        },
        bearish: {
            icon: TrendingDown,
            color: "text-red-500",
            bg: "bg-red-500/10",
            label: "Bearish",
        },
        neutral: {
            icon: Minus,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            label: "Neutral",
        },
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        AI Research Agent
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {report && (
                            <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
                                via {report.provider}
                            </span>
                        )}
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="text-xs border rounded px-2 py-1 bg-background text-foreground"
                        >
                            {availableModels.map(m => (
                                <option key={m.id} value={m.id} disabled={!m.available}>
                                    {m.label} {!m.available && '(Req. Key)'}
                                </option>
                            ))}
                            {availableModels.length === 0 && (
                                <>
                                    <option value="gemini-flash">Gemini Flash</option>
                                    <option value="gemini-pro">Gemini Pro</option>
                                    <option value="gpt-4o">GPT-4o</option>
                                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                                </>
                            )}
                        </select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {!report && !isLoading && (
                    <div className="text-center py-6">
                        <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground mb-4">
                            Generate an AI-powered research report for{" "}
                            <span className="font-semibold text-foreground">{companyName || symbol}</span>
                        </p>
                        <Button onClick={handleGenerate} className="gap-2">
                            <Zap className="h-4 w-4" />
                            Generate Report
                        </Button>
                        <p className="text-xs text-muted-foreground mt-3">
                            Uses Perplexity for news search + GPT-4o/Gemini for analysis.
                            Configure API keys in Settings for best results.
                        </p>
                    </div>
                )}

                {isLoading && (
                    <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
                        <p className="text-sm text-muted-foreground">
                            Analyzing {companyName || symbol}...
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Searching news, processing data, generating insights
                        </p>
                    </div>
                )}

                {error && (
                    <div className="text-center py-6">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                        <p className="text-sm text-destructive">{error}</p>
                        <Button variant="outline" onClick={handleGenerate} className="mt-3">
                            Retry
                        </Button>
                    </div>
                )}

                {report && !isLoading && (
                    <div className="space-y-4">
                        {/* Sentiment Badge */}
                        {report.sentiment && sentimentConfig[report.sentiment] && (
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${sentimentConfig[report.sentiment].bg}`}>
                                {(() => {
                                    const Icon = sentimentConfig[report.sentiment].icon;
                                    return <Icon className={`h-4 w-4 ${sentimentConfig[report.sentiment].color}`} />;
                                })()}
                                <span className={`text-sm font-semibold ${sentimentConfig[report.sentiment].color}`}>
                                    {sentimentConfig[report.sentiment].label}
                                </span>
                            </div>
                        )}

                        {/* Summary */}
                        <p className="text-sm leading-relaxed">{report.summary}</p>

                        {/* Key Points */}
                        {report.keyPoints?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                                    <Zap className="h-3.5 w-3.5 text-primary" />
                                    Key Points
                                </h4>
                                <ul className="space-y-1">
                                    {report.keyPoints.map((point, i) => (
                                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                            <span className="text-primary mt-1">•</span>
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Risks */}
                        {report.risks?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                    Risks
                                </h4>
                                <ul className="space-y-1">
                                    {report.risks.map((risk, i) => (
                                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                            <span className="text-amber-500 mt-1">•</span>
                                            <span>{risk}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Catalysts */}
                        {report.catalysts?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                    Catalysts
                                </h4>
                                <ul className="space-y-1">
                                    {report.catalysts.map((catalyst, i) => (
                                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                            <span className="text-emerald-500 mt-1">•</span>
                                            <span>{catalyst}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Citations */}
                        {report.citations?.length > 0 && (
                            <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-1">Sources</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {report.citations.map((url, i) => (
                                        <a
                                            key={i}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline bg-primary/5 px-2 py-0.5 rounded"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            Source {i + 1}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Regenerate */}
                        <Button variant="outline" size="sm" onClick={handleGenerate} className="w-full">
                            <Brain className="h-3.5 w-3.5 mr-2" />
                            Regenerate Report
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
