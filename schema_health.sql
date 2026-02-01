-- Fix for Habits Table (Weekly Schedule)
ALTER TABLE public.habits 
ADD COLUMN IF NOT EXISTS target_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6];

-- Health Metrics Table
CREATE TABLE IF NOT EXISTS public.health_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    weight NUMERIC(5,2), -- in kg
    height NUMERIC(5,2), -- in cm (usually static, but can track growth/changes or just store latest)
    sleep_hours NUMERIC(4,1),
    water_intake INTEGER, -- in ml
    mood VARCHAR(50), -- e.g., 'happy', 'neutral', 'sad'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- Food Logs Table (for Calorie Tracking)
CREATE TABLE IF NOT EXISTS public.food_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    meal_type VARCHAR(20), -- 'breakfast', 'lunch', 'dinner', 'snack'
    food_item TEXT NOT NULL,
    quantity TEXT, -- e.g., "1 large", "100g"
    calories INTEGER,
    protein INTEGER, -- in grams
    carbs INTEGER, -- in grams
    fats INTEGER, -- in grams
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

-- Health Metrics Policies
CREATE POLICY "Users can view their own health metrics" ON public.health_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health metrics" ON public.health_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health metrics" ON public.health_metrics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health metrics" ON public.health_metrics
    FOR DELETE USING (auth.uid() = user_id);

-- Food Logs Policies
CREATE POLICY "Users can view their own food logs" ON public.food_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own food logs" ON public.food_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food logs" ON public.food_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food logs" ON public.food_logs
    FOR DELETE USING (auth.uid() = user_id);
