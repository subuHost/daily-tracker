"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
} from "lucide-react";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addMonths,
    subMonths,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
} from "date-fns";

interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    type: "task" | "bill" | "birthday" | "habit";
    color: string;
}

const sampleEvents: CalendarEvent[] = [
    { id: "1", title: "Electricity Bill Due", date: "2026-01-25", type: "bill", color: "#ef4444" },
    { id: "2", title: "Mom's Birthday", date: "2026-01-28", type: "birthday", color: "#ec4899" },
    { id: "3", title: "Project Deadline", date: "2026-01-23", type: "task", color: "#3b82f6" },
    { id: "4", title: "Gym", date: "2026-01-21", type: "habit", color: "#22c55e" },
    { id: "5", title: "Gym", date: "2026-01-20", type: "habit", color: "#22c55e" },
    { id: "6", title: "Gym", date: "2026-01-19", type: "habit", color: "#22c55e" },
    { id: "7", title: "Internet Bill", date: "2026-01-28", type: "bill", color: "#ef4444" },
];

export default function CalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const goToToday = () => {
        setCurrentMonth(new Date());
        setSelectedDate(new Date());
    };

    const getEventsForDate = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return sampleEvents.filter((event) => event.date === dateStr);
    };

    const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
                    <p className="text-muted-foreground">View all your events</p>
                </div>
                <Button variant="outline" onClick={goToToday}>
                    Today
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Calendar Grid */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Day headers */}
                        <div className="grid grid-cols-7 mb-2">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                <div
                                    key={day}
                                    className="text-center text-sm font-medium text-muted-foreground py-2"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar days */}
                        <div className="grid grid-cols-7 gap-1">
                            {days.map((day, index) => {
                                const dayEvents = getEventsForDate(day);
                                const isSelected = selectedDate && isSameDay(day, selectedDate);
                                const isCurrentMonth = isSameMonth(day, currentMonth);

                                return (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedDate(day)}
                                        className={`
                      aspect-square p-1 rounded-lg text-sm relative
                      ${isCurrentMonth ? "" : "text-muted-foreground/50"}
                      ${isToday(day) ? "bg-primary text-primary-foreground" : ""}
                      ${isSelected && !isToday(day) ? "bg-accent" : ""}
                      ${!isSelected && !isToday(day) ? "hover:bg-accent/50" : ""}
                    `}
                                    >
                                        <span className="block">{format(day, "d")}</span>
                                        {dayEvents.length > 0 && (
                                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                                {dayEvents.slice(0, 3).map((event, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-1.5 h-1.5 rounded-full"
                                                        style={{ backgroundColor: event.color }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Selected Date Events */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedDateEvents.length > 0 ? (
                            <div className="space-y-3">
                                {selectedDateEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        className="flex items-center gap-3 p-2 rounded-lg bg-accent/50"
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: event.color }}
                                        />
                                        <div>
                                            <p className="text-sm font-medium">{event.title}</p>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {event.type}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No events on this day</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Legend */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 justify-center">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-sm text-muted-foreground">Tasks</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="text-sm text-muted-foreground">Bills</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-pink-500" />
                            <span className="text-sm text-muted-foreground">Birthdays</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-sm text-muted-foreground">Habits</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
