import { createClient } from "@/lib/supabase/server";
import { CaseWorkbench } from "@/components/study/system-design/case-workbench";
import { notFound, redirect } from "next/navigation";
import { SystemDesignCase } from "@/lib/db/study";

interface PageProps {
    params: { id: string };
}

export default async function SystemDesignCasePage({ params }: PageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    let initialData: SystemDesignCase | null = null;

    if (params.id === 'new') {
        // Prepare blank state
        initialData = {
            id: '', // Will be assigned by backend on first save usually, OR we create draft immediately.
            // Better UX: Create draft row immediately so we have an ID? 
            // Or let the component handle 'new' logic? 
            // Let's create a temp object and rely on actions to Insert if ID is missing or 'new'.
            // Actually, for robust images/uploads, we usually want an ID.
            // Let's stick to: if 'new', we render blank form, save triggers INSERT.
            user_id: user.id,
            title: "New System Design Case",
            status: 'To_Study',
            youtube_url: '',
            requirements_functional: '',
            requirements_non_functional: '',
            estimations: '',
            architecture_image_url: '',
            component_selection: '',
            deep_dive_notes: '',
            trade_offs: '',
            is_completed: false,
            completion_date: null,
            created_at: new Date().toISOString()
        };
    } else {
        const { data, error } = await supabase
            .from('system_design_cases')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error || !data) {
            notFound();
        }
        initialData = data;
    }

    if (!initialData) {
        return <div>Loading...</div>; // Should be handled by notFound() but satisfies TS
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-10">
            <CaseWorkbench initialData={initialData} />
        </div>
    );
}
