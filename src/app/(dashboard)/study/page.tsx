import { createClient } from "@/lib/supabase/server";
import { getGroupedProblems, Problem } from "@/lib/db/study";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, GraduationCap, CheckCircle2, Youtube, Flame } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProblemRow } from "@/components/study/dsa-sheet/problem-row";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProblemsTable } from "@/components/study/dsa-sheet/problems-table";

export default async function StudyDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const groupedProblems = await getGroupedProblems(supabase);
    const topics = Object.keys(groupedProblems);
    const allProblems = Object.values(groupedProblems).flat();

    // Calculate Overall Progress
    const total = allProblems.length;
    const completed = allProblems.filter(p => p.is_completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Helper for robust string comparison
    const isDiff = (p: Problem, d: string) => p.difficulty?.trim().toLowerCase() === d.toLowerCase();

    const easyTotal = allProblems.filter(p => isDiff(p, 'easy')).length;
    const easyDone = allProblems.filter(p => isDiff(p, 'easy') && p.is_completed).length;

    const medTotal = allProblems.filter(p => isDiff(p, 'medium')).length;
    const medDone = allProblems.filter(p => isDiff(p, 'medium') && p.is_completed).length;

    const hardTotal = allProblems.filter(p => isDiff(p, 'hard')).length;
    const hardDone = allProblems.filter(p => isDiff(p, 'hard') && p.is_completed).length;

    return (
        <div className="h-full flex flex-col space-y-6 overflow-hidden p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">DSA Sheet</h1>
                    <p className="text-muted-foreground">Progress: {percentage}% ({completed}/{total})</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/study/system-design">
                        <Button variant="outline">System Design</Button>
                    </Link>
                </div>
            </div>

            <Tabs defaultValue="topics" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                    <TabsTrigger value="topics">Topic View</TabsTrigger>
                    <TabsTrigger value="table">All Problems (Excel)</TabsTrigger>
                </TabsList>

                <TabsContent value="topics" className="flex-1 overflow-y-auto space-y-6 mt-4 pr-2">
                    {/* Overall Progress Card */}
                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <span className="text-green-600 font-medium text-sm">Easy ({easyDone}/{easyTotal})</span>
                                <Progress value={(easyDone / easyTotal) * 100 || 0} className="bg-green-100 dark:bg-green-900/20 [&>div]:bg-green-500 h-2" />
                            </div>
                            <div className="space-y-1">
                                <span className="text-yellow-600 font-medium text-sm">Medium ({medDone}/{medTotal})</span>
                                <Progress value={(medDone / medTotal) * 100 || 0} className="bg-yellow-100 dark:bg-yellow-900/20 [&>div]:bg-yellow-500 h-2" />
                            </div>
                            <div className="space-y-1">
                                <span className="text-red-600 font-medium text-sm">Hard ({hardDone}/{hardTotal})</span>
                                <Progress value={(hardDone / hardTotal) * 100 || 0} className="bg-red-100 dark:bg-red-900/20 [&>div]:bg-red-500 h-2" />
                            </div>
                        </div>
                    </div>

                    {/* Topics Accordion */}
                    <div className="space-y-4 pb-10">
                        <Accordion type="multiple" className="w-full space-y-4">
                            {topics.map((topic, index) => {
                                const loadingProblems = groupedProblems[topic];
                                const topicTotal = loadingProblems.length;
                                const topicCompleted = loadingProblems.filter(p => p.is_completed).length;
                                const topicProgress = (topicCompleted / topicTotal) * 100 || 0;

                                return (
                                    <AccordionItem key={topic} value={topic} className="border px-4 py-2 rounded-lg bg-card mb-2">
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="flex items-center justify-between w-full pr-4">
                                                <div className="text-left">
                                                    <div className="font-semibold text-lg">{topic}</div>
                                                    <div className="text-xs text-muted-foreground font-normal mt-1">
                                                        {topicCompleted} / {topicTotal} Completed
                                                    </div>
                                                </div>
                                                <div className="w-24 md:w-32 mr-4">
                                                    <Progress value={topicProgress} className="h-2" />
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4">
                                            <div className="rounded-md border divide-y">
                                                {loadingProblems.map(problem => (
                                                    <ProblemRow key={problem.id} problem={problem} />
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    </div>
                </TabsContent>

                <TabsContent value="table" className="flex-1 mt-4 overflow-hidden">
                    <ProblemsTable problems={allProblems} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
