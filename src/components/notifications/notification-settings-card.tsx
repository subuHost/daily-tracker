'use client';

// Tech Plan — Phase 6C: Notification System
// UI for user notification settings and push permission management

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { requestPushPermission, checkPushStatus } from '@/lib/push';
import { updateNotificationSettings, getNotificationSettings } from '@/app/actions/notifications';
import { toast } from 'sonner';
import { Bell, Clock, Calendar, Briefcase, Smile, BookOpen, Receipt, LineChart, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface NotificationSettingsProps {
    initialSettings?: any;
}

export function NotificationSettingsCard({ initialSettings }: NotificationSettingsProps) {
    const [settings, setSettings] = useState(initialSettings || {});
    const [loading, setLoading] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);
    const [pushStatus, setPushStatus] = useState<{ subscribed: boolean; vapidConfigured: boolean; error?: string } | null>(null);

    useEffect(() => {
        const checkStatus = async () => {
            const status = await checkPushStatus();
            setPushStatus(status);
        };
        checkStatus();
    }, []);


    useEffect(() => {
        if (!initialSettings) {
            const load = async () => {
                const data = await getNotificationSettings();
                if (data) setSettings(data);
            };
            load();
        }
    }, [initialSettings]);

    const handleToggle = async (key: string, value: boolean) => {
        setSettings({ ...settings, [key]: value });
        const result = await updateNotificationSettings({ [key]: value });
        if (!result.success) {
            toast.error('Failed to update setting');
            setSettings({ ...settings, [key]: !value });
        }
    };

    const handleTimeChange = async (key: string, value: string) => {
        setSettings({ ...settings, [key]: value });
        const result = await updateNotificationSettings({ [key]: value });
        if (!result.success) {
            toast.error('Failed to update reminder time');
        }
    };

    const handleEnablePush = async () => {
        setPushLoading(true);
        const result = await requestPushPermission();
        if (result.success) {
            toast.success('Push notifications enabled!');
            setSettings({ ...settings, push_enabled: true });
            await updateNotificationSettings({ push_enabled: true });
            const status = await checkPushStatus();
            setPushStatus(status);

        } else {
            toast.error(`Push error: ${result.error}`);
        }
        setPushLoading(false);
    };

    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notification Settings
                </CardTitle>
                <CardDescription>
                    Choose how and when we should nudge you.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Habit Reminders */}
                <div className="flex items-center justify-between group">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-emerald-500" />
                            <span className="font-semibold text-sm">Habit Reminders</span>
                        </div>
                        <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Daily if not logged.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {settings.notif_habit_enabled && (
                            <Input
                                type="time"
                                value={settings.notif_habit_time || '21:00'}
                                onChange={(e) => handleTimeChange('notif_habit_time', e.target.value)}
                                className="w-24 h-8 text-xs bg-muted/50 border-none rounded-full px-3"
                            />
                        )}
                        <Switch
                            checked={settings.notif_habit_enabled}
                            onCheckedChange={(v) => handleToggle('notif_habit_enabled', v)}
                            className="bg-emerald-500"
                        />
                    </div>
                </div>

                {/* Journal Prompts */}
                <div className="flex items-center justify-between group">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Smile className="h-4 w-4 text-cyan-500" />
                            <span className="font-semibold text-sm">Journal Prompts</span>
                        </div>
                        <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Mindset check-in prompts.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {settings.notif_journal_enabled && (
                            <Input
                                type="time"
                                value={settings.notif_journal_time || '20:00'}
                                onChange={(e) => handleTimeChange('notif_journal_time', e.target.value)}
                                className="w-24 h-8 text-xs bg-muted/50 border-none rounded-full px-3"
                            />
                        )}
                        <Switch
                            checked={settings.notif_journal_enabled}
                            onCheckedChange={(v) => handleToggle('notif_journal_enabled', v)}
                            className="bg-cyan-500"
                        />
                    </div>
                </div>

                {/* Finance Nudges */}
                <div className="flex items-center justify-between group">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-rose-500" />
                            <span className="font-semibold text-sm">Finance Nudges</span>
                        </div>
                        <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Daily nudge if no expense logged.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {settings.notif_finance_enabled && (
                            <Input
                                type="time"
                                value={settings.notif_finance_time || '22:00'}
                                onChange={(e) => handleTimeChange('notif_finance_time', e.target.value)}
                                className="w-24 h-8 text-xs bg-muted/50 border-none rounded-full px-3"
                            />
                        )}
                        <Switch
                            checked={settings.notif_finance_enabled}
                            onCheckedChange={(v) => handleToggle('notif_finance_enabled', v)}
                            className="bg-rose-500"
                        />
                    </div>
                </div>

                {/* Study Review */}
                <div className="flex items-center justify-between group">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-500" />
                            <span className="font-semibold text-sm">Study Review Ready</span>
                        </div>
                        <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Immediate nudge for SRS cards.</p>
                    </div>
                    <Switch
                        checked={settings.notif_study_enabled}
                        onCheckedChange={(v) => handleToggle('notif_study_enabled', v)}
                        className="bg-blue-500"
                    />
                </div>

                {/* Bill Overdue */}
                <div className="flex items-center justify-between group">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-orange-500" />
                            <span className="font-semibold text-sm">Bill Overdue Alerts</span>
                        </div>
                        <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Alerts for overdue bills.</p>
                    </div>
                    <Switch
                        checked={settings.notif_bill_enabled}
                        onCheckedChange={(v) => handleToggle('notif_bill_enabled', v)}
                        className="bg-orange-500"
                    />
                </div>

                {/* Budget Alert */}
                <div className="flex items-center justify-between group">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <LineChart className="h-4 w-4 text-indigo-500" />
                            <span className="font-semibold text-sm">Budget Alerts (80%)</span>
                        </div>
                        <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Nudge on budget limits.</p>
                    </div>
                    <Switch
                        checked={settings.notif_budget_enabled}
                        onCheckedChange={(v) => handleToggle('notif_budget_enabled', v)}
                        className="bg-indigo-500"
                    />
                </div>

                {/* Push Notifications Section */}
                <div className="mt-8 p-4 rounded-2xl bg-primary/5 border border-primary/10 shadow-inner group">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="font-bold text-sm text-primary">Browser Push</span>
                                <p className="text-xs text-muted-foreground">Receive nudges even when app is closed.</p>
                            </div>
                            <Button
                                variant={settings.push_enabled ? "outline" : "default"}
                                size="sm"
                                onClick={handleEnablePush}
                                disabled={pushLoading || settings.push_enabled}
                                className="rounded-full px-6 transition-all active:scale-95 bg-primary/20 backdrop-blur-sm border-none text-primary hover:bg-primary/30"
                            >
                                {pushLoading ? 'Enabling...' : settings.push_enabled ? 'Enabled' : 'Enable'}
                            </Button>
                        </div>

                        {pushStatus && (
                            <div className="pt-1">
                                {!pushStatus.vapidConfigured ? (
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <p className="flex items-center gap-1.5 italic">
                                            ❌ VAPID keys not configured
                                        </p>
                                        <p className="text-[10px] leading-relaxed opacity-75">
                                            Add <code className="bg-muted px-1 rounded">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> and <code className="bg-muted px-1 rounded">VAPID_PRIVATE_KEY</code> to your environment variables (Vercel Dashboard → Settings → Environment Variables), then redeploy.
                                            Generate keys with: <code className="bg-muted px-1 rounded">npx web-push generate-vapid-keys</code>
                                        </p>
                                    </div>
                                ) : pushStatus.subscribed ? (
                                    <p className="text-xs text-emerald-500 font-medium flex items-center gap-1.5">
                                        ✅ Push subscription active
                                    </p>
                                ) : (
                                    <p className="text-xs text-amber-500 font-medium flex items-center gap-1.5">
                                        ⚠️ Not subscribed — click Enable Notifications
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                </div>

            </CardContent>
        </Card>
    );
}
