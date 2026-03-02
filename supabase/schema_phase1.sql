-- Phase 1: AI-First Intelligent Life Management Platform
-- New tables for daily briefing caching and user preferences
-- Run this in your Supabase SQL editor

-- ======================
-- daily_briefings table
-- ======================
CREATE TABLE IF NOT EXISTS daily_briefings (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  content     TEXT NOT NULL,
  context_snapshot JSONB,
  generated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily_briefings"
  ON daily_briefings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily_briefings"
  ON daily_briefings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily_briefings"
  ON daily_briefings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own daily_briefings"
  ON daily_briefings FOR DELETE USING (auth.uid() = user_id);

-- ======================
-- user_preferences table
-- ======================
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  widget_order    TEXT[],
  hidden_widgets  TEXT[],
  calorie_goal    INTEGER DEFAULT 2000,
  protein_goal    INTEGER DEFAULT 150,
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own user_preferences"
  ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_preferences"
  ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_preferences"
  ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_preferences"
  ON user_preferences FOR DELETE USING (auth.uid() = user_id);
