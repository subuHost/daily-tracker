-- Run this in your Supabase SQL Editor to create the System Design table

-- 1. Create the Status Enum
CREATE TYPE system_design_status AS ENUM ('To_Study', 'Drafting', 'Reviewing', 'Mastered');

-- 2. Create the Table
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

-- 3. Enable RLS
ALTER TABLE public.system_design_cases ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
DROP POLICY IF EXISTS "Users can view own system design" ON public.system_design_cases;
DROP POLICY IF EXISTS "Users can insert own system design" ON public.system_design_cases;
DROP POLICY IF EXISTS "Users can update own system design" ON public.system_design_cases;
DROP POLICY IF EXISTS "Users can delete own system design" ON public.system_design_cases;

CREATE POLICY "Users can view own system design" ON public.system_design_cases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own system design" ON public.system_design_cases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own system design" ON public.system_design_cases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own system design" ON public.system_design_cases FOR DELETE USING (auth.uid() = user_id);
