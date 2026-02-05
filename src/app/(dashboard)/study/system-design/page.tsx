import { createClient } from "@/lib/supabase/server";
import { getSystemDesignCases, SystemDesignCase } from "@/lib/db/study";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SystemDesignPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const cases = await getSystemDesignCases(supabase);

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Design</h1>
                    <p className="text-muted-foreground">Architecting scalable systems. Practice cases.</p>
                </div>
                <Link href="/study/system-design/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> New Case
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cases.length === 0 ? (
                    <div className="col-span-full text-center p-12 border rounded-lg border-dashed text-muted-foreground">
                        No system design cases started yet. Start your first design!
                    </div>
                ) : (
                    cases.map((c: SystemDesignCase) => (
                        <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle>{c.title}</CardTitle>
                                    <Badge variant={c.status === 'Mastered' ? 'default' : 'secondary'}>
                                        {c.status}
                                    </Badge>
                                </div>
                                <CardDescription>Created {new Date(c.created_at).toLocaleDateString()}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground line-clamp-3">
                                    {/* Show preview of requirements or content if available */}
                                    {c.requirements_functional || "No requirements defined yet."}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Link href={`/study/system-design/${c.id}`} className="w-full">
                                    <Button variant="outline" className="w-full">Open Workbench</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
