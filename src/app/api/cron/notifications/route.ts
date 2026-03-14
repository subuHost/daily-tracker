'use strict';

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

interface NotificationPayload {
    user_id: string;
    title: string;
    body: string;
    type: string;
    action_url?: string;
}

/**
 * Cron endpoint — checks notification conditions and sends push notifications.
 * Called every 15 minutes via Vercel Cron or manual trigger.
 *
 * Auth: CRON_SECRET header or ?secret= query param.
 */
export async function GET(request: Request) {
    // Auth: Verify cron secret
    const { searchParams } = new URL(request.url);
    const secret = request.headers.get('x-cron-secret') || searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date();
    const currentHH = now.getHours().toString().padStart(2, '0');
    const currentMM = now.getMinutes();
    // Round to nearest 15-min window
    const windowStart = Math.floor(currentMM / 15) * 15;
    const timeWindow = `${currentHH}:${windowStart.toString().padStart(2, '0')}`;
    const today = now.toISOString().split('T')[0];

    const notifications: NotificationPayload[] = [];

    try {
        // ── Habit Reminders ──────────────────────────────────
        const { data: habitUsers } = await supabase
            .from('user_preferences')
            .select('user_id, notif_habit_time')
            .eq('notif_habit_enabled', true)
            .eq('push_enabled', true);

        if (habitUsers) {
            for (const u of habitUsers) {
                const userTime = (u.notif_habit_time || '21:00').slice(0, 5);
                if (!isInTimeWindow(userTime, timeWindow)) continue;

                // Check if habits logged today
                const { count } = await supabase
                    .from('habit_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', u.user_id)
                    .gte('created_at', `${today}T00:00:00`);

                if (!count || count === 0) {
                    notifications.push({
                        user_id: u.user_id,
                        title: 'Habit Reminder',
                        body: "You haven't logged any habits today. Keep your streak going!",
                        type: 'habit_reminder',
                        action_url: '/habits',
                    });
                }
            }
        }

        // ── Journal Prompts ──────────────────────────────────
        const { data: journalUsers } = await supabase
            .from('user_preferences')
            .select('user_id, notif_journal_time')
            .eq('notif_journal_enabled', true)
            .eq('push_enabled', true);

        if (journalUsers) {
            for (const u of journalUsers) {
                const userTime = (u.notif_journal_time || '20:00').slice(0, 5);
                if (!isInTimeWindow(userTime, timeWindow)) continue;

                const { count } = await supabase
                    .from('journal_entries')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', u.user_id)
                    .gte('created_at', `${today}T00:00:00`);

                if (!count || count === 0) {
                    notifications.push({
                        user_id: u.user_id,
                        title: 'Journal Check-in',
                        body: 'Take a moment to reflect on your day. How are you feeling?',
                        type: 'journal_prompt',
                        action_url: '/journal',
                    });
                }
            }
        }

        // ── Finance Nudges ──────────────────────────────────
        const { data: financeUsers } = await supabase
            .from('user_preferences')
            .select('user_id, notif_finance_time')
            .eq('notif_finance_enabled', true)
            .eq('push_enabled', true);

        if (financeUsers) {
            for (const u of financeUsers) {
                const userTime = (u.notif_finance_time || '22:00').slice(0, 5);
                if (!isInTimeWindow(userTime, timeWindow)) continue;

                const { count } = await supabase
                    .from('expenses')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', u.user_id)
                    .gte('created_at', `${today}T00:00:00`);

                if (!count || count === 0) {
                    notifications.push({
                        user_id: u.user_id,
                        title: 'Finance Nudge',
                        body: "Log today's expenses to stay on top of your spending.",
                        type: 'finance_nudge',
                        action_url: '/finance/expenses',
                    });
                }
            }
        }

        // ── Bill Overdue Alerts ──────────────────────────────
        const { data: billUsers } = await supabase
            .from('user_preferences')
            .select('user_id')
            .eq('notif_bill_enabled', true)
            .eq('push_enabled', true);

        if (billUsers && timeWindow === '09:00') {
            // Check bills once daily at 9 AM
            for (const u of billUsers) {
                const { data: overdueBills } = await supabase
                    .from('bills')
                    .select('name')
                    .eq('user_id', u.user_id)
                    .eq('is_paid', false)
                    .lt('due_date', today)
                    .limit(3);

                if (overdueBills && overdueBills.length > 0) {
                    const names = overdueBills.map(b => b.name).join(', ');
                    notifications.push({
                        user_id: u.user_id,
                        title: 'Bill Overdue!',
                        body: `You have overdue bills: ${names}. Pay them to avoid late fees.`,
                        type: 'bill_overdue',
                        action_url: '/finance/bills',
                    });
                }
            }
        }

        // ── Budget Alerts (80% threshold) ────────────────────
        const { data: budgetUsers } = await supabase
            .from('user_preferences')
            .select('user_id')
            .eq('notif_budget_enabled', true)
            .eq('push_enabled', true);

        if (budgetUsers && timeWindow === '18:00') {
            // Check budgets once daily at 6 PM
            for (const u of budgetUsers) {
                const { data: budgets } = await supabase
                    .from('budgets')
                    .select('id, category, amount')
                    .eq('user_id', u.user_id)
                    .eq('period', 'monthly');

                if (budgets) {
                    const monthStart = `${today.slice(0, 7)}-01`;
                    for (const budget of budgets) {
                        const { data: spent } = await supabase
                            .from('expenses')
                            .select('amount')
                            .eq('user_id', u.user_id)
                            .eq('category', budget.category)
                            .gte('date', monthStart)
                            .lte('date', today);

                        const totalSpent = (spent || []).reduce((sum, e) => sum + Number(e.amount), 0);
                        const threshold = Number(budget.amount) * 0.8;

                        if (totalSpent >= threshold) {
                            notifications.push({
                                user_id: u.user_id,
                                title: 'Budget Alert',
                                body: `You've used ${Math.round((totalSpent / Number(budget.amount)) * 100)}% of your ${budget.category} budget.`,
                                type: 'budget_alert',
                                action_url: '/finance/budget',
                            });
                        }
                    }
                }
            }
        }

        // ── Send all notifications via internal API ──────────
        let sent = 0;
        let failed = 0;

        // Deduplicate by user_id + type (avoid sending same type twice to same user)
        const deduped = deduplicateNotifications(notifications);

        // Check for already-sent notifications today to avoid duplicates
        for (const notif of deduped) {
            const { count: alreadySent } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', notif.user_id)
                .eq('type', notif.type)
                .gte('created_at', `${today}T00:00:00`);

            if (alreadySent && alreadySent > 0) continue;

            try {
                const res = await fetch(`${APP_URL}/api/push/send`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-cron-secret': process.env.CRON_SECRET || '',
                    },
                    body: JSON.stringify(notif),
                });

                if (res.ok) sent++;
                else failed++;
            } catch {
                failed++;
            }
        }

        return NextResponse.json({
            success: true,
            time_window: timeWindow,
            candidates: notifications.length,
            deduped: deduped.length,
            sent,
            failed,
        });
    } catch (error) {
        console.error('Cron notification error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

/**
 * Check if a user's preferred time falls within the current 15-min window.
 */
function isInTimeWindow(userTime: string, windowStart: string): boolean {
    const [uh, um] = userTime.split(':').map(Number);
    const [wh, wm] = windowStart.split(':').map(Number);

    const userMinutes = uh * 60 + um;
    const windowMinutes = wh * 60 + wm;

    return userMinutes >= windowMinutes && userMinutes < windowMinutes + 15;
}

/**
 * Remove duplicate notifications for the same user + type.
 */
function deduplicateNotifications(notifs: NotificationPayload[]): NotificationPayload[] {
    const seen = new Set<string>();
    return notifs.filter((n) => {
        const key = `${n.user_id}:${n.type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
