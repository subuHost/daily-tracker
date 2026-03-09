-- Tech Plan — Phase 6D: Multi-Model AI
-- Extend user_ai_settings for Claude and Grok

ALTER TABLE user_ai_settings ADD COLUMN IF NOT EXISTS claude_api_key TEXT;
ALTER TABLE user_ai_settings ADD COLUMN IF NOT EXISTS grok_api_key TEXT;

-- Update the comment on preferred_model to reflect new valid values
COMMENT ON COLUMN user_ai_settings.preferred_model IS 'User''s preferred AI model: ''gemini-flash'', ''gemini-pro'', ''gpt-4o'', ''gpt-4o-mini'', ''claude-3-5-sonnet'', ''claude-3-haiku'', ''grok-2'', ''grok-2-mini''';
