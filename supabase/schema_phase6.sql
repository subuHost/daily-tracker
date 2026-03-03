-- Phase 6: Mobile-Native UX, General Chat & Notifications
-- New tables for ChatGPT-style session-based chat and the notification system

-- ======================
-- chat_folders table
-- ======================
CREATE TABLE IF NOT EXISTS chat_folders (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  color       TEXT DEFAULT '#3b82f6', -- Standard blue
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chat_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chat_folders"
  ON chat_folders FOR ALL USING (auth.uid() = user_id);

-- ======================
-- chat_sessions table
-- ======================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  folder_id   UUID REFERENCES chat_folders(id) ON DELETE SET NULL,
  title       TEXT NOT NULL DEFAULT 'New Conversation',
  model       TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
  is_pinned   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chat_sessions"
  ON chat_sessions FOR ALL USING (auth.uid() = user_id);

-- ======================
-- chat_session_messages table
-- ======================
CREATE TABLE IF NOT EXISTS chat_session_messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chat_session_messages ENABLE ROW LEVEL SECURITY;

-- Note: session_id is linked to chat_sessions which has its own user_id check.
-- For simplicity, we can use a subquery or join for RLS, but standard practice is 
-- to either add user_id here too or use a policy that checks session ownership.
CREATE POLICY "Users can manage own chat_session_messages"
  ON chat_session_messages FOR ALL USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- ======================
-- notifications table
-- ======================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type        TEXT NOT NULL, -- e.g. 'habit', 'journal', 'finance', 'study', 'system'
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  data        JSONB DEFAULT '{}',
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notifications"
  ON notifications FOR ALL USING (auth.uid() = user_id);

-- ======================
-- notification_settings table
-- ======================
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  habit_reminders BOOLEAN DEFAULT true,
  journal_prompts BOOLEAN DEFAULT true,
  finance_alerts  BOOLEAN DEFAULT true,
  study_nudges    BOOLEAN DEFAULT true,
  bill_alerts     BOOLEAN DEFAULT true,
  preferred_time  TIME DEFAULT '21:00:00', -- Default 9 PM
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification_settings"
  ON notification_settings FOR ALL USING (auth.uid() = user_id);

-- ======================
-- Indices for performance
-- ======================
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id, updated_at DESC);
CREATE INDEX idx_chat_session_messages_session ON chat_session_messages(session_id, created_at ASC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
