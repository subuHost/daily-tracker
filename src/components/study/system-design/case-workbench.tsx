"use client";

import { useState } from "react";
import { SystemDesignCase, CaseStatus } from "@/lib/db/study";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Save, ExternalLink } from "lucide-react";
import { saveSystemDesignCaseAction } from "@/app/actions";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface CaseWorkbenchProps {
    initialData: SystemDesignCase;
}

export function CaseWorkbench({ initialData }: CaseWorkbenchProps) {
    const [data, setData] = useState<SystemDesignCase>(initialData);
    const [loading, setLoading] = useState(false);

    // Debounced save could be better, but explicit Save for now to ensure clarity
    const handleSave = async (newData: SystemDesignCase) => {
        setData(newData);
        setLoading(true);
        try {
            await saveSystemDesignCaseAction(newData.id, newData);
            toast.success("Changes saved");
        } catch (e) {
            toast.error("Failed to save");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof SystemDesignCase, value: any) => {
        const newData = { ...data, [field]: value };
        // Auto-save on blur logic could go here, but for now we update state locally
        // and rely on a global save or specific actions 
        setData(newData);
    };

    const handleBlur = () => {
        // Trigger save on field blur
        handleSave(data);
    };

    const handleStatusChange = (status: CaseStatus) => {
        const newData = { ...data, status };
        if (status === 'Mastered') {
            newData.is_completed = true;
            newData.completion_date = new Date().toISOString();
        }
        handleSave(newData);
    };

    const markCompleted = () => {
        handleStatusChange('Mastered');
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex-1 w-full space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Design Case Title</Label>
                    <Input
                        value={data.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        onBlur={handleBlur}
                        className="text-2xl font-bold h-auto border-transparent hover:border-input px-0 focus-visible:px-2 rounded-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Select value={data.status} onValueChange={(v) => handleStatusChange(v as CaseStatus)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="To_Study">To Study</SelectItem>
                            <SelectItem value="Drafting">Drafting</SelectItem>
                            <SelectItem value="Reviewing">Reviewing</SelectItem>
                            <SelectItem value="Mastered">Mastered</SelectItem>
                        </SelectContent>
                    </Select>

                    {data.is_completed ? (
                        <Button variant="outline" className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100 cursor-default">
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Completed
                        </Button>
                    ) : (
                        <Button onClick={markCompleted}>
                            Mark as Completed
                        </Button>
                    )}
                </div>
            </div>

            {/* RESOURCE BAR */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-3 border-l-4 border-l-primary/20">
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <Label className="w-24 shrink-0">Video URL</Label>
                            <Input
                                placeholder="Paste YouTube link (e.g. https://youtu.be/...)"
                                value={data.youtube_url || ""}
                                onChange={(e) => handleChange('youtube_url', e.target.value)}
                                onBlur={handleBlur}
                            />
                        </div>

                        {data.youtube_url && (
                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/5 mt-4">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={data.youtube_url.replace("watch?v=", "embed/")}
                                    title="Reference Video"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* WORKFLOW SECTIONS */}
            <Accordion type="multiple" defaultValue={["requirements", "design"]} className="space-y-4">

                {/* 1. REQUIREMENTS */}
                <AccordionItem value="requirements" className="border rounded-lg bg-card px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</div>
                            <span className="font-semibold text-lg">Requirements Analysis</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-primary font-semibold">Functional Requirements</Label>
                                <Textarea
                                    placeholder="- User can post a tweet&#10;- User can follow others..."
                                    className="min-h-[200px] font-mono text-sm leading-relaxed"
                                    value={data.requirements_functional || ""}
                                    onChange={(e) => handleChange('requirements_functional', e.target.value)}
                                    onBlur={handleBlur}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-primary font-semibold">Non-Functional (Scale, CAP)</Label>
                                <Textarea
                                    placeholder="- Highly Available (AP)&#10;- Low Latency (<200ms)&#10;- Eventual Consistency..."
                                    className="min-h-[200px] font-mono text-sm leading-relaxed"
                                    value={data.requirements_non_functional || ""}
                                    onChange={(e) => handleChange('requirements_non_functional', e.target.value)}
                                    onBlur={handleBlur}
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 2. ESTIMATIONS */}
                <AccordionItem value="estimations" className="border rounded-lg bg-card px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">2</div>
                            <span className="font-semibold text-lg">Estimations & Math</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6">
                        <div className="p-4 bg-muted/30 rounded-lg border-dashed border">
                            <Textarea
                                placeholder="Calculate DAU, QPS, Storage per year, Bandwidth needs..."
                                className="min-h-[150px] font-mono text-sm border-0 bg-transparent focus-visible:ring-0 resize-y"
                                value={data.estimations || ""}
                                onChange={(e) => handleChange('estimations', e.target.value)}
                                onBlur={handleBlur}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 3. HIGH LEVEL DESIGN */}
                <AccordionItem value="design" className="border rounded-lg bg-card px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">3</div>
                            <span className="font-semibold text-lg">High Level Design</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-6">
                        <div className="space-y-2">
                            <Label>Architecture Diagram URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="https://excalidraw.com/..."
                                    value={data.architecture_image_url || ""}
                                    onChange={(e) => handleChange('architecture_image_url', e.target.value)}
                                    onBlur={handleBlur}
                                />
                                {data.architecture_image_url && (
                                    <Button variant="ghost" size="icon" asChild>
                                        <a href={data.architecture_image_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Component Selection & Flow</Label>
                            <Textarea
                                placeholder="Explained the flow: Client -> LB -> API Gateway -> Service..."
                                className="min-h-[150px]"
                                value={data.component_selection || ""}
                                onChange={(e) => handleChange('component_selection', e.target.value)}
                                onBlur={handleBlur}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 4. DEEP DIVE */}
                <AccordionItem value="deep_dive" className="border rounded-lg bg-card px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-xs font-bold">4</div>
                            <span className="font-semibold text-lg">Deep Dive & Trade-offs</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 space-y-6">
                        <div className="space-y-2">
                            <Label>Deep Dive Notes (Markdown)</Label>
                            <Textarea
                                placeholder="# Database Schema&#10;...&#10;# Bottlenecks&#10;..."
                                className="min-h-[300px] font-mono"
                                value={data.deep_dive_notes || ""}
                                onChange={(e) => handleChange('deep_dive_notes', e.target.value)}
                                onBlur={handleBlur}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Trade-offs</Label>
                            <Textarea
                                placeholder="Consistency vs Availability choices..."
                                className="min-h-[100px]"
                                value={data.trade_offs || ""}
                                onChange={(e) => handleChange('trade_offs', e.target.value)}
                                onBlur={handleBlur}
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
