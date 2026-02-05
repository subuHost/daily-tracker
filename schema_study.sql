-- Study & Interview Prep Module Schema (DSA Sheet Version)
-- FIXED: Added DROP TYPE CASCADE to prevent "type already exists" errors

-- 1. CLEANUP (Careful: This deletes data in these tables)
DROP TABLE IF EXISTS public.attempts CASCADE;
DROP TABLE IF EXISTS public.problems CASCADE;
DROP TABLE IF EXISTS public.study_topics CASCADE;
DROP TABLE IF EXISTS public.system_design_cases CASCADE;

-- 2. DROP TYPES (To fix the "already exists" error)
DROP TYPE IF EXISTS problem_difficulty_enum CASCADE;
DROP TYPE IF EXISTS attempt_outcome CASCADE;
DROP TYPE IF EXISTS system_design_status CASCADE;

-- 3. RE-CREATE TYPES
CREATE TYPE problem_difficulty_enum AS ENUM ('Easy', 'Medium', 'Hard');
CREATE TYPE attempt_outcome AS ENUM ('Solved', 'Failed', 'Hint_Used');
CREATE TYPE system_design_status AS ENUM ('To_Study', 'Drafting', 'Reviewing', 'Mastered');

-- 4. CREATE TABLES

-- Problems Table (Aligned with DSA Sheet CSV)
CREATE TABLE IF NOT EXISTS public.problems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- CSV Mapped Columns
    question_number INTEGER,
    title TEXT NOT NULL, 
    companies TEXT, 
    topic_category TEXT, 
    comment TEXT, 
    difficulty TEXT, -- Text allows 'Easy', 'Medium', 'Hard' from CSV directly
    link TEXT, 
    link_gfg TEXT, 
    frequency_score INTEGER DEFAULT 0, 
    
    -- Tracking State
    is_completed BOOLEAN DEFAULT FALSE,
    completion_date TIMESTAMP WITH TIME ZONE,
    
    -- SRS Metadata (Keeping for hybrid usage)
    srs_bucket INTEGER DEFAULT 0,
    next_review_at TIMESTAMP WITH TIME ZONE,
    
    -- Legacy/Internal fields
    difficulty_official problem_difficulty_enum DEFAULT 'Medium', -- strictly for internal logic if needed
    difficulty_personal INTEGER,
    tags_pattern TEXT[],
    video_solution_link TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Attempts Table (History & Logging)
CREATE TABLE IF NOT EXISTS public.attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    outcome attempt_outcome NOT NULL,
    confidence_rating INTEGER, -- 1-5
    time_taken_seconds INTEGER,
    notes_markdown TEXT,
    code_snippet TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- System Design Cases
CREATE TABLE IF NOT EXISTS public.system_design_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    status system_design_status DEFAULT 'To_Study',
    
    -- Content Fields
    youtube_url TEXT,
    requirements_functional TEXT,
    requirements_non_functional TEXT,
    estimations TEXT,
    architecture_image_url TEXT,
    component_selection TEXT,
    deep_dive_notes TEXT,
    trade_offs TEXT,

    -- Tracking
    is_completed BOOLEAN DEFAULT FALSE,
    completion_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ENABLE RLS
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_design_cases ENABLE ROW LEVEL SECURITY;

-- 6. CREATE POLICIES (Idempotent-ish since we dropped tables, but recreating them is fine)
DROP POLICY IF EXISTS "Users can view own problems" ON public.problems;
DROP POLICY IF EXISTS "Users can insert own problems" ON public.problems;
DROP POLICY IF EXISTS "Users can update own problems" ON public.problems;
DROP POLICY IF EXISTS "Users can delete own problems" ON public.problems;

CREATE POLICY "Users can view own problems" ON public.problems FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own problems" ON public.problems FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own problems" ON public.problems FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own problems" ON public.problems FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own attempts" ON public.attempts;
DROP POLICY IF EXISTS "Users can insert own attempts" ON public.attempts;
DROP POLICY IF EXISTS "Users can update own attempts" ON public.attempts;

CREATE POLICY "Users can view own attempts" ON public.attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attempts" ON public.attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attempts" ON public.attempts FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own system design" ON public.system_design_cases;
DROP POLICY IF EXISTS "Users can insert own system design" ON public.system_design_cases;
DROP POLICY IF EXISTS "Users can update own system design" ON public.system_design_cases;

CREATE POLICY "Users can view own system design" ON public.system_design_cases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own system design" ON public.system_design_cases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own system design" ON public.system_design_cases FOR UPDATE USING (auth.uid() = user_id);
