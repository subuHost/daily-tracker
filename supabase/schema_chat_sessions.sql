-- Chat Sessions and Folders Schema (Idempotent)
-- Run this in your Supabase SQL editor

-- 1. Chat Folders Table
CREATE TABLE IF NOT EXISTS chat_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES chat_folders(id) ON DELETE SET NULL,
  title VARCHAR(200) DEFAULT 'New Conversation',
  model VARCHAR(20) DEFAULT 'flash', 
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure model column has correct constraints if it already exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_sessions' AND column_name='model') THEN
        ALTER TABLE chat_sessions ALTER COLUMN model SET DEFAULT 'flash';
        -- Drop existing constraint if it exists to recreate it correctly
        ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_model_check;
        ALTER TABLE chat_sessions ADD CONSTRAINT chat_sessions_model_check CHECK (model IN ('flash', 'pro'));
    END IF;
END $$;

-- 3. Chat Session Messages Table
CREATE TABLE IF NOT EXISTS chat_session_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_updated ON chat_sessions(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_session_messages_sess ON chat_session_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_folders_user ON chat_folders(user_id);

-- 5. Enable Row Level Security
ALTER TABLE chat_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_session_messages ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies (Clean and Recreate)

-- Chat Folders
DROP POLICY IF EXISTS "Users can view own chat_folders" ON chat_folders;
DROP POLICY IF EXISTS "Users can insert own chat_folders" ON chat_folders;
DROP POLICY IF EXISTS "Users can update own chat_folders" ON chat_folders;
DROP POLICY IF EXISTS "Users can delete own chat_folders" ON chat_folders;
DROP POLICY IF EXISTS "Users can manage own chat_folders" ON chat_folders; -- from schema_phase6

CREATE POLICY "Users can view own chat_folders" ON chat_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat_folders" ON chat_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat_folders" ON chat_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat_folders" ON chat_folders FOR DELETE USING (auth.uid() = user_id);

-- Chat Sessions
DROP POLICY IF EXISTS "Users can view own chat_sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can insert own chat_sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update own chat_sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can delete own chat_sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can manage own chat_sessions" ON chat_sessions; -- from schema_phase6

CREATE POLICY "Users can view own chat_sessions" ON chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat_sessions" ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat_sessions" ON chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat_sessions" ON chat_sessions FOR DELETE USING (auth.uid() = user_id);

-- Chat Session Messages
CREATE POLICY "Users can view own chat_session_messages" ON chat_session_messages FOR SELECT 
USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own chat_session_messages" ON chat_session_messages FOR INSERT 
WITH CHECK (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own chat_session_messages" ON chat_session_messages FOR UPDATE 
USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own chat_session_messages" ON chat_session_messages FOR DELETE 
USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));
