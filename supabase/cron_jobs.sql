-- Tech Plan — Phase 6C: Notification System
-- pg_cron jobs and SQL functions for automated notifications
-- Run this in your Supabase SQL editor (requires pg_cron extension to be enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ==========================================
-- SQL Function: Generate habit reminders
-- ==========================================
CREATE OR REPLACE FUNCTION generate_habit_notifications() 
RETURNS void AS $$
DECLARE
    notif_row RECORD;
BEGIN
    FOR notif_row IN 
        SELECT 
            up.user_id,
            'habit_reminder'::text as type,
            '🎯 Habit Reminder'::text as title,
            'You haven’t logged all your habits for today!'::text as body,
            '/habits'::text as action_url
        FROM user_preferences up
        JOIN auth.users au ON au.id = up.user_id
        WHERE up.notif_habit_enabled = TRUE
        -- Check if there are any active habits not logged today
        AND EXISTS (
            SELECT 1 FROM habits h
            LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.logged_at::date = CURRENT_DATE
            WHERE h.user_id = up.user_id 
            AND h.is_active = TRUE
            AND hl.id IS NULL
        )
        -- Avoid duplicate notifications for the same day
        AND NOT EXISTS (
            SELECT 1 FROM notifications n
            WHERE n.user_id = up.user_id
            AND n.type = 'habit_reminder'
            AND n.created_at::date = CURRENT_DATE
        )
    LOOP
        INSERT INTO notifications (user_id, type, title, body, action_url)
        VALUES (notif_row.user_id, notif_row.type, notif_row.title, notif_row.body, notif_row.action_url);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- SQL Function: Generate journal prompts
-- ==========================================
CREATE OR REPLACE FUNCTION generate_journal_notifications() 
RETURNS void AS $$
DECLARE
    notif_row RECORD;
BEGIN
    FOR notif_row IN 
        SELECT 
            up.user_id,
            'journal_prompt'::text as type,
            '📝 Daily Journal'::text as title,
            'Take a moment to reflect on your day.'::text as body,
            '/chat'::text as action_url
        FROM user_preferences up
        WHERE up.notif_journal_enabled = TRUE
        -- Check if no journal entry exists for today
        AND NOT EXISTS (
            SELECT 1 FROM journal_entries je
            WHERE je.user_id = up.user_id
            AND je.created_at::date = CURRENT_DATE
        )
        -- Avoid duplicate notifications for the same day
        AND NOT EXISTS (
            SELECT 1 FROM notifications n
            WHERE n.user_id = up.user_id
            AND n.type = 'journal_prompt'
            AND n.created_at::date = CURRENT_DATE
        )
    LOOP
        INSERT INTO notifications (user_id, type, title, body, action_url)
        VALUES (notif_row.user_id, notif_row.type, notif_row.title, notif_row.body, notif_row.action_url);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- SQL Function: Generate finance nudge
-- ==========================================
CREATE OR REPLACE FUNCTION generate_finance_notifications() 
RETURNS void AS $$
DECLARE
    notif_row RECORD;
BEGIN
    FOR notif_row IN 
        SELECT 
            up.user_id,
            'finance_nudge'::text as type,
            '💸 Expense Nudge'::text as title,
            'You haven’t logged any expenses today. Keep your tracker up-to-date!'::text as body,
            '/finance'::text as action_url
        FROM user_preferences up
        WHERE up.notif_finance_enabled = TRUE
        -- Check if no transactions exist for today
        AND NOT EXISTS (
            SELECT 1 FROM transactions t
            WHERE t.user_id = up.user_id
            AND t.date = CURRENT_DATE
        )
        -- Avoid duplicate notifications for the same day
        AND NOT EXISTS (
            SELECT 1 FROM notifications n
            WHERE n.user_id = up.user_id
            AND n.type = 'finance_nudge'
            AND n.created_at::date = CURRENT_DATE
        )
    LOOP
        INSERT INTO notifications (user_id, type, title, body, action_url)
        VALUES (notif_row.user_id, notif_row.type, notif_row.title, notif_row.body, notif_row.action_url);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- SQL Function: Generate bill overdue alerts
-- ==========================================
CREATE OR REPLACE FUNCTION generate_bill_notifications() 
RETURNS void AS $$
DECLARE
    notif_row RECORD;
BEGIN
    FOR notif_row IN 
        SELECT 
            up.user_id,
            'bill_overdue'::text as type,
            '🧾 Bill Alert: ' || b.name as title,
            'Your bill for ' || b.name || ' is due today or was due yesterday. Mark it as paid!'::text as body,
            '/finance/bills'::text as action_url
        FROM user_preferences up
        JOIN bills b ON b.user_id = up.user_id
        WHERE up.notif_bill_enabled = TRUE
        AND b.is_paid = FALSE
        AND (b.due_date = CURRENT_DATE OR b.due_date = CURRENT_DATE - INTERVAL '1 day')
        -- Avoid duplicate notifications for the same bill on the same day
        AND NOT EXISTS (
            SELECT 1 FROM notifications n
            WHERE n.user_id = up.user_id
            AND n.type = 'bill_overdue'
            AND n.title LIKE '%' || b.name || '%'
            AND n.created_at::date = CURRENT_DATE
        )
    LOOP
        INSERT INTO notifications (user_id, type, title, body, action_url)
        VALUES (notif_row.user_id, notif_row.type, notif_row.title, notif_row.body, notif_row.action_url);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Register pg_cron jobs
-- Note: Schedules are in UTC. Adjust as needed.
-- 15:30 UTC is 9:00 PM IST
-- 14:30 UTC is 8:00 PM IST
-- 16:30 UTC is 10:00 PM IST
-- ==========================================

-- Habit Reminders at 9 PM IST
SELECT cron.schedule('habit-reminders', '30 15 * * *', 'SELECT generate_habit_notifications()');

-- Journal Prompts at 8 PM IST
SELECT cron.schedule('journal-prompts', '30 14 * * *', 'SELECT generate_journal_notifications()');

-- Finance Nudge at 10 PM IST
SELECT cron.schedule('finance-nudge', '30 16 * * *', 'SELECT generate_finance_notifications()');

-- Bill Alerts at 10 AM IST
SELECT cron.schedule('bill-overdue', '30 4 * * *', 'SELECT generate_bill_notifications()');
