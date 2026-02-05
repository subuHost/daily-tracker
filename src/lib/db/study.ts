import { createClient } from "@/lib/supabase/client";

// Types matching the DB schema
export type TopicCategory = 'DSA' | 'SystemDesign';
export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard';
export type AttemptOutcome = 'Solved' | 'Failed' | 'Hint_Used';
export type CaseStatus = 'To_Study' | 'Drafting' | 'Reviewing' | 'Mastered';

export interface StudyTopic {
    id: string;
    user_id: string;
    name: string;
    category: TopicCategory;
    parent_topic_id: string | null;
    created_at: string;
}

export interface Problem {
    id: string;
    user_id: string;

    // DSA Sheet Columns
    title: string;
    question_number: number | null;
    companies: string | null; // Stored as CSV string usually
    topic_category: string | null;
    comment: string | null;
    difficulty: string | null; // Text now to match CSV flexibility
    link: string | null;
    link_gfg: string | null;
    frequency_score: number | null;

    // State
    is_completed: boolean;
    completion_date: string | null;

    // Legacy / Hybrid
    difficulty_official: ProblemDifficulty;
    difficulty_personal: number | null;
    tags_pattern: string[] | null;
    video_solution_link: string | null;
    srs_bucket: number;
    next_review_at: string | null;
    created_at: string;
}

export interface Attempt {
    id: string;
    user_id: string;
    problem_id: string;
    timestamp: string;
    outcome: AttemptOutcome;
    confidence_rating: number;
    time_taken_seconds: number | null;
    notes_markdown: string | null;
    code_snippet: string | null;
    created_at: string;
}

export interface SystemDesignCase {
    id: string;
    user_id: string;
    title: string;
    status: CaseStatus;

    youtube_url: string | null;
    requirements_functional: string | null;
    requirements_non_functional: string | null;
    estimations: string | null;
    architecture_image_url: string | null;
    component_selection: string | null;
    deep_dive_notes: string | null;
    trade_offs: string | null;

    is_completed: boolean;
    completion_date: string | null;
    created_at: string;
}

// Spaced Repetition Logic (Simplified SM-2)
function calculateNextReview(currentBucket: number, confidence: number): { nextBucket: number; intervalDays: number } {
    let nextBucket = currentBucket;
    let intervalDays = 1;

    if (confidence <= 2) {
        // Failed or struggled heavily: Reset
        nextBucket = 0;
        intervalDays = 1;
    } else if (confidence === 3) {
        // Hard but solved: Short increment
        nextBucket = 1;
        intervalDays = 3;
    } else {
        // Good/Easy (4-5): Exponential
        if (currentBucket === 0) {
            nextBucket = 1;
            intervalDays = 3;
        } else if (currentBucket === 1) {
            nextBucket = 2;
            intervalDays = 7;
        } else {
            nextBucket = currentBucket + 1;
            intervalDays = Math.ceil(Math.pow(2.2, nextBucket));
        }
    }

    return { nextBucket, intervalDays };
}

// ------ PROBLEMS ------

export async function getReviewQueue(supabaseClient?: any) {
    const supabase = supabaseClient || createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('user_id', user.id)
        .or(`next_review_at.lte.${now},next_review_at.is.null`)
        .order('next_review_at', { ascending: true });

    if (error) throw error;
    return data as Problem[];
}

export async function getGroupedProblems(supabaseClient?: any) {
    const supabase = supabaseClient || createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Fetch all problems
    const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('user_id', user.id)
        .order('question_number', { ascending: true }); // Default sort by number

    if (error) throw error;

    // Group by Topic
    const grouped: Record<string, Problem[]> = {};
    (data as Problem[]).forEach(p => {
        const topic = p.topic_category || 'Uncategorized';
        if (!grouped[topic]) grouped[topic] = [];
        grouped[topic].push(p);
    });

    return grouped;
}

export async function createProblem(input: Partial<Problem>, supabaseClient?: any) {
    const supabase = supabaseClient || createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from('problems')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();

    if (error) throw error;
    return data as Problem;
}

export async function getProblem(id: string, supabaseClient?: any) {
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Problem;
}

// ------ ATTEMPTS & SRS ------

export async function logAttempt(
    problemId: string,
    attemptData: {
        outcome: AttemptOutcome;
        confidence_rating: number;
        time_taken_seconds?: number;
        notes_markdown?: string;
        code_snippet?: string;
    },
    currentSrsBucket: number,
    supabaseClient?: any
) {
    const supabase = supabaseClient || createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // 1. Calculate new SRS state
    const { nextBucket, intervalDays } = calculateNextReview(currentSrsBucket, attemptData.confidence_rating);
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

    // 2. Insert Attempt
    const { error: attemptError } = await supabase
        .from('attempts')
        .insert({
            user_id: user.id,
            problem_id: problemId,
            outcome: attemptData.outcome,
            confidence_rating: attemptData.confidence_rating,
            time_taken_seconds: attemptData.time_taken_seconds,
            notes_markdown: attemptData.notes_markdown,
            code_snippet: attemptData.code_snippet,
            timestamp: new Date().toISOString()
        });

    if (attemptError) throw attemptError;

    // 3. Update Problem SRS State
    const { error: problemError } = await supabase
        .from('problems')
        .update({
            srs_bucket: nextBucket,
            next_review_at: nextReviewDate.toISOString(),
            difficulty_personal: calculatePersonalDifficulty(attemptData.confidence_rating)
        })
        .eq('id', problemId);

    if (problemError) throw problemError;

    return { nextBucket, nextReviewAt: nextReviewDate };
}

function calculatePersonalDifficulty(confidence: number): number {
    return Math.max(1, Math.min(10, 11 - (confidence * 2)));
}

export async function getProblemHistory(problemId: string, supabaseClient?: any) {
    const supabase = supabaseClient || createClient();
    const { data, error } = await supabase
        .from('attempts')
        .select('*')
        .eq('problem_id', problemId)
        .order('timestamp', { ascending: false });

    if (error) throw error;
    return data as Attempt[];
}

// ------ SYSTEM DESIGN ------

export async function getSystemDesignCases(supabaseClient?: any) {
    const supabase = supabaseClient || createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from('system_design_cases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SystemDesignCase[];
}

export async function saveSystemDesignCase(input: Partial<SystemDesignCase>, supabaseClient?: any) {
    const supabase = supabaseClient || createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    if (input.id) {
        const { data, error } = await supabase
            .from('system_design_cases')
            .update(input)
            .eq('id', input.id)
            .select()
            .single();
        if (error) throw error;
        return data;
    } else {
        const { data, error } = await supabase
            .from('system_design_cases')
            .insert({ ...input, user_id: user.id })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
}
