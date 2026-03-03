'use strict';

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { subscription, userAgent } = await request.json();

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
        }

        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth_key: subscription.keys.auth,
                user_agent: userAgent,
                last_used_at: new Date().toISOString()
            }, { onConflict: 'endpoint' });

        if (error) {
            console.error('Error saving push subscription:', error);
            return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
