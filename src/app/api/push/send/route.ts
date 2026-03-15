'use strict';

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

// Configure VAPID
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:notifications@dailytracker.app',
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );
}

export interface SendPushPayload {
    user_id: string;
    title: string;
    body: string;
    type?: string;
    action_url?: string;
}

/**
 * Send a push notification to a user AND insert an in-app notification.
 *
 * Auth: Either a valid user session (for manual triggers)
 * or CRON_SECRET header (for scheduled cron calls).
 */
export async function POST(request: Request) {
    const supabase = await createClient();

    // Auth check: either session user or cron secret
    const cronSecret = request.headers.get('x-cron-secret');
    const isCron = cronSecret && cronSecret === process.env.CRON_SECRET;

    if (!isCron) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const payload: SendPushPayload = await request.json();
        const { user_id, title, body, type = 'general', action_url } = payload;

        if (!user_id || !title || !body) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Insert in-app notification
        const { error: notifError } = await supabase
            .from('notifications')
            .insert({
                user_id,
                title,
                body,
                type,
                action_url: action_url || null,
                is_read: false,
            });

        if (notifError) {
            console.error('Failed to insert notification:', notifError);
        }

        // 2. Send push notifications to all subscribed devices
        let pushSent = 0;
        let pushFailed = 0;

        if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
            const { data: subscriptions } = await supabase
                .from('push_subscriptions')
                .select('endpoint, p256dh, auth_key')
                .eq('user_id', user_id);

            if (subscriptions && subscriptions.length > 0) {
                const pushPayload = JSON.stringify({ title, body, action_url });

                const pushPromises = subscriptions.map(async (sub) => {
                    try {
                        await webpush.sendNotification(
                            {
                                endpoint: sub.endpoint,
                                keys: {
                                    p256dh: sub.p256dh,
                                    auth: sub.auth_key,
                                },
                            },
                            pushPayload
                        );
                        pushSent++;
                    } catch (err: any) {
                        pushFailed++;
                        // Remove expired/invalid subscriptions
                        if (err.statusCode === 404 || err.statusCode === 410) {
                            await supabase
                                .from('push_subscriptions')
                                .delete()
                                .eq('endpoint', sub.endpoint);
                        }
                        console.error(`Push failed for ${sub.endpoint}:`, err.message);
                    }
                });

                await Promise.all(pushPromises);
            }
        }

        return NextResponse.json({
            success: true,
            notification_inserted: !notifError,
            push_sent: pushSent,
            push_failed: pushFailed,
        });
    } catch (error) {
        console.error('Send push error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
