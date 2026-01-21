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

export default function CalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [events] = useState<CalendarEvent[]>([]);

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
        return events.filter((event) => event.date === dateStr);
    };

    const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Calendar</h1>
                    <p className="text-muted-foreground text-sm">View all your events</p>
                </div>
                <Button variant="outline" onClick={goToToday} className="w-full sm:w-auto">
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
                            <CardTitle className="text-base sm:text-lg">{format(currentMonth, "MMMM yyyy")}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Day headers */}
                        <div className="grid grid-cols-7 mb-2">
                            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                                <div
                                    key={i}
                                    className="text-center text-xs sm:text-sm font-medium text-muted-foreground py-2"
                                >
                                    <span className="sm:hidden">{day}</span>
                                    <span className="hidden sm:inline">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]}</span>
                                </div>
                            ))}
                        </div>

                        {/* Calendar days */}
                        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                            {days.map((day, index) => {
                                const dayEvents = getEventsForDate(day);
                                const isSelected = selectedDate && isSameDay(day, selectedDate);
                                const isCurrentMonth = isSameMonth(day, currentMonth);

                                return (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedDate(day)}
                                        className={`
                                            aspect-square p-0.5 sm:p-1 rounded-lg text-xs sm:text-sm relative
                                            ${isCurrentMonth ? "" : "text-muted-foreground/50"}
                                            ${isToday(day) ? "bg-primary text-primary-foreground" : ""}
                                            ${isSelected && !isToday(day) ? "bg-accent" : ""}
                                            ${!isSelected && !isToday(day) ? "hover:bg-accent/50" : ""}
                                        `}
                                    >
                                        <span className="block">{format(day, "d")}</span>
                                        {dayEvents.length > 0 && (
                                            <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                                {dayEvents.slice(0, 3).map((event, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full"
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
                                <p className="text-xs mt-1">Events from tasks, bills, and birthdays will appear here</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Legend */}
            <Card>
                <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500" />
                            <span className="text-xs sm:text-sm text-muted-foreground">Tasks</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500" />
                            <span className="text-xs sm:text-sm text-muted-foreground">Bills</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-pink-500" />
                            <span className="text-xs sm:text-sm text-muted-foreground">Birthdays</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500" />
                            <span className="text-xs sm:text-sm text-muted-foreground">Habits</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
