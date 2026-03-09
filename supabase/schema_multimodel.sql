-- Migration: Add Claude and Grok API key columns to user_ai_settings
-- Run this in Supabase SQL editor if user_ai_settings table already exists
-- Safe to run multiple times (IF NOT EXISTS)
ALTER TABLE user_ai_settings ADD COLUMN IF NOT EXISTS claude_api_key TEXT;
ALTER TABLE user_ai_settings ADD COLUMN IF NOT EXISTS grok_api_key TEXT;
