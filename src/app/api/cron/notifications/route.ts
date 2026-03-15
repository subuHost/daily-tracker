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
 * Runs once daily at 8 AM UTC via Vercel Cron (Hobby plan: daily only).
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

        if (billUsers) {
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

        if (budgetUsers) {
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

        // ── Portfolio Research (stock alerts) ─────────────────
        // Trigger portfolio research in the background (don't block notifications)
        fetch(`${APP_URL}/api/cron/portfolio-research?secret=${encodeURIComponent(process.env.CRON_SECRET || '')}`, {
            method: 'GET',
        }).catch(err => console.error('Portfolio research trigger failed:', err));

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
