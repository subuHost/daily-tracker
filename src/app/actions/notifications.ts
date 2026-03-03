"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getNotifications(limit = 50, onlyUnread = false) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (onlyUnread) {
        query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return data;
}

export async function getUnreadCount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 0;

    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

    if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
    }

    return count || 0;
}

export async function markNotificationRead(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false };

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error marking notification as read:', error);
        return { success: false };
    }

    revalidatePath('/notifications');
    return { success: true };
}

export async function markAllNotificationsRead() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false };

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

    if (error) {
        console.error('Error marking all notifications as read:', error);
        return { success: false };
    }

    revalidatePath('/notifications');
    return { success: true };
}

export async function getNotificationSettings() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from('user_preferences')
        .select(`
      notif_habit_enabled,
      notif_habit_time,
      notif_journal_enabled,
      notif_journal_time,
      notif_finance_enabled,
      notif_finance_time,
      notif_bill_enabled,
      notif_study_enabled,
      notif_budget_enabled,
      push_enabled
    `)
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Error fetching notification settings:', error);
        return null;
    }

    return data;
}

export async function updateNotificationSettings(updates: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false };

    // Use upsert because user_preferences record might not exist yet for new users
    const { error } = await supabase
        .from('user_preferences')
        .upsert({
            user_id: user.id,
            ...updates,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error('Error updating notification settings:', error);
        return { success: false };
    }

    revalidatePath('/notifications');
    return { success: true };
}
