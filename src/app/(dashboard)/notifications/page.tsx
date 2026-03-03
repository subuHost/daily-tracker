import { getNotifications, getNotificationSettings, markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications";
import { NotificationSettingsCard } from "@/components/notifications/notification-settings-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Bell, Check, Calendar, Receipt, BookOpen, Smile, AlertTriangle, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default async function NotificationsPage() {
    const notifications = await getNotifications();
    const settings = await getNotificationSettings();
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'habit_reminder': return <Calendar className="h-5 w-5 text-emerald-500" />;
            case 'journal_prompt': return <Smile className="h-5 w-5 text-cyan-500" />;
            case 'finance_nudge': return <Receipt className="h-5 w-5 text-rose-500" />;
            case 'bill_overdue': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
            case 'study_review': return <BookOpen className="h-5 w-5 text-blue-500" />;
            case 'budget_alert': return <Receipt className="h-5 w-5 text-indigo-500" />;
            default: return <Bell className="h-5 w-5 text-primary" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'habit_reminder': return 'bg-emerald-500/10';
            case 'journal_prompt': return 'bg-cyan-500/10';
            case 'finance_nudge': return 'bg-rose-500/10';
            case 'bill_overdue': return 'bg-orange-500/10';
            case 'study_review': return 'bg-blue-500/10';
            case 'budget_alert': return 'bg-indigo-500/10';
            default: return 'bg-primary/10';
        }
    };

    return (
        <div className="container mx-auto max-w-2xl min-h-screen pb-20 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-extrabold flex items-center gap-3">
                        <Bell className="h-8 w-8 text-primary animate-pulse" />
                        Notifications
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2 animate-bounce rounded-full px-2 py-0.5 text-xs">
                                {unreadCount} New
                            </Badge>
                        )}
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium">Your personalized nudges and alerts.</p>
                </div>
                {unreadCount > 0 && (
                    <form action={async () => {
                        "use server";
                        await markAllNotificationsRead();
                    }}>
                        <Button variant="outline" size="sm" type="submit" className="rounded-full gap-2 border-primary/20 text-primary hover:bg-primary/10 transition-all active:scale-95 shadow-lg">
                            <Check className="h-4 w-4" />
                            Mark all read
                        </Button>
                    </form>
                )}
            </div>

            <div className="space-y-4 mb-12">
                {notifications.length > 0 ? (
                    notifications.map((notif) => (
                        <Card
                            key={notif.id}
                            className={`group border-border/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-xl ${notif.is_read ? 'opacity-80' : 'bg-primary/5 shadow-lg border-primary/20'}`}
                        >
                            <div className="flex items-start gap-4 p-5">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${getBgColor(notif.type)} group-hover:scale-110 transition-transform duration-300`}>
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1 space-y-1.5 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className={`font-bold text-base truncate ${notif.is_read ? 'text-foreground/80' : 'text-foreground'}`}>
                                            {notif.title}
                                        </h3>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-1 rounded-full">
                                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                            </span>
                                            {!notif.is_read && (
                                                <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-lg shadow-primary/50 animate-pulse" />
                                            )}
                                        </div>
                                    </div>
                                    <p className={`text-sm leading-relaxed ${notif.is_read ? 'text-muted-foreground' : 'text-foreground/90 font-medium'}`}>
                                        {notif.body}
                                    </p>
                                    <div className="flex items-center gap-4 pt-3">
                                        {notif.action_url && (
                                            <Link href={notif.action_url}>
                                                <Button variant="ghost" size="sm" className="h-8 rounded-full gap-2 text-primary hover:bg-primary/10 hover:text-primary-foreground group-hover:px-4 transition-all duration-300">
                                                    Action <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                            </Link>
                                        )}
                                        {!notif.is_read && (
                                            <form action={async () => {
                                                "use server";
                                                await markNotificationRead(notif.id);
                                            }}>
                                                <Button variant="ghost" size="sm" type="submit" className="h-8 rounded-full text-muted-foreground hover:text-primary">
                                                    Mark read
                                                </Button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-card/40 border border-dashed rounded-3xl border-border/50">
                        <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                            <Bell className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No notifications yet</h3>
                        <p className="text-muted-foreground max-w-sm mb-6">
                            You're all caught up! When we have updates or reminders for you, they'll show up here.
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                <NotificationSettingsCard initialSettings={settings} />
            </div>
        </div>
    );
}
