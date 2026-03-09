-- ==========================================
-- SETUP REQUIRED (Supabase Dashboard):
-- 1. Deploy push-dispatcher Edge Function:
--      supabase functions deploy push-dispatcher
-- 2. Set VAPID secrets in Supabase:
--      supabase secrets set VAPID_PUBLIC_KEY=<your_public_key> \
--                           VAPID_PRIVATE_KEY=<your_private_key> \
--                           VAPID_SUBJECT=mailto:you@example.com
-- 3. Create DB Webhook in Supabase Dashboard:
--      Database > Webhooks > New Webhook
--      Table: notifications | Event: INSERT
--      URL: https://<project-ref>.supabase.co/functions/v1/push-dispatcher
-- 4. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY in .env.local:
--      NEXT_PUBLIC_VAPID_PUBLIC_KEY=<same value as VAPID_PUBLIC_KEY>
--      (Generate keys with: npx web-push generate-vapid-keys)
-- ==========================================
-- Tech Plan — Phase 6C: Notification System
-- New tables and schema extensions for notifications
-- Run this in your Supabase SQL editor
-- ==========================================

-- ==========================================
-- Extend user_preferences table
-- ==========================================
ALTER TABLE user_preferences 
  ADD COLUMN IF NOT EXISTS notif_habit_enabled     BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notif_habit_time        TIME DEFAULT '21:00',   -- 9 PM
  ADD COLUMN IF NOT EXISTS notif_journal_enabled   BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notif_journal_time      TIME DEFAULT '22:00',   -- 10 PM
  ADD COLUMN IF NOT EXISTS notif_finance_enabled   BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notif_finance_time      TIME DEFAULT '22:00',   -- 10 PM
  ADD COLUMN IF NOT EXISTS notif_bill_enabled      BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notif_study_enabled     BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notif_budget_enabled    BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS push_enabled            BOOLEAN DEFAULT FALSE;

-- ==========================================
-- New table: notifications
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type        VARCHAR(30) NOT NULL
              CHECK (type IN (
                'habit_reminder', 'journal_prompt', 'finance_nudge',
                'bill_overdue', 'study_review', 'budget_alert',
                'streak_at_risk', 'weekly_report'
              )),
  title       VARCHAR(200) NOT NULL,
  body        TEXT,
  action_url  VARCHAR(500),          -- Deep link: '/habits', '/finance/bills', etc.
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_read  ON notifications(user_id, is_read, created_at DESC);

-- ==========================================
-- New table: push_subscriptions
-- ==========================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint     TEXT NOT NULL UNIQUE,   -- Push service URL (browser-specific)
  p256dh       TEXT NOT NULL,          -- Encryption key
  auth_key     TEXT NOT NULL,          -- Auth secret
  user_agent   TEXT,                   -- For display: "Chrome on Android"
  created_at   TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies for push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own push_subscriptions" ON push_subscriptions;
CREATE POLICY "Users can view own push_subscriptions"
  ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own push_subscriptions" ON push_subscriptions;
CREATE POLICY "Users can insert own push_subscriptions"
  ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own push_subscriptions" ON push_subscriptions;
CREATE POLICY "Users can update own push_subscriptions"
  ON push_subscriptions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own push_subscriptions" ON push_subscriptions;
CREATE POLICY "Users can delete own push_subscriptions"
  ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user  ON push_subscriptions(user_id);
