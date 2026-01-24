"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { getUpcomingEvents, type Event } from "@/lib/db/events";
import { format, isToday, isTomorrow } from "date-fns";

export function EventsWidget() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await getUpcomingEvents(3);
                setEvents(data);
            } catch (error) {
                console.error("Failed to load events:", error);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    const getTypeColor = (type: string) => {
        switch (type) {
            case "meeting": return "bg-blue-500/10 text-blue-600";
            case "birthday": return "bg-pink-500/10 text-pink-600";
            case "function": return "bg-purple-500/10 text-purple-600";
            default: return "bg-muted text-muted-foreground";
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent className="py-6 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                <Button variant="ghost" size="icon" asChild className="h-6 w-6">
                    <Link href="/events/new">
                        <Plus className="h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {events.length > 0 ? (
                        events.map((event) => {
                            const date = new Date(event.date);
                            const dayLabel = isToday(date) ? "Today" : isTomorrow(date) ? "Tomorrow" : format(date, "MMM d");

                            return (
                                <div key={event.id} className="flex items-start gap-3">
                                    <div className="flex flex-col items-center bg-muted rounded p-1.5 min-w-[40px]">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                            {format(date, "MMM")}
                                        </span>
                                        <span className="text-lg font-bold leading-none">
                                            {format(date, "d")}
                                        </span>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">{event.title}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${getTypeColor(event.type)}`}>
                                                {event.type}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-medium text-orange-600">
                                                {dayLabel}
                                            </span>
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <MapPin className="h-3 w-3" />
                                                <span className="truncate max-w-[150px]">{event.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-4 text-muted-foreground space-y-2">
                            <Calendar className="h-8 w-8 mx-auto opacity-20" />
                            <p className="text-sm">No upcoming events</p>
                        </div>
                    )}

                    <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                        <Link href="/calendar">View Calendar</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
