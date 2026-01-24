import { createClient } from "@/lib/supabase/client";
import { format, startOfMonth, endOfMonth, isSameDay } from "date-fns";

export interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    type: "task" | "bill" | "birthday" | "habit" | "log" | "event" | "finance";
    color: string;
    details?: any; // For modal
    isTotal?: boolean;
}

export async function getCalendarEvents(start: Date, end: Date): Promise<CalendarEvent[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const startDateStr = format(start, "yyyy-MM-dd");
    const endDateStr = format(end, "yyyy-MM-dd");

    const events: CalendarEvent[] = [];

    // 1. Fetch Tasks (Due Date)
    const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .gte("due_date", startDateStr)
        .lte("due_date", endDateStr);

    if (tasks) {
        tasks.forEach(task => {
            events.push({
                id: `task-${task.id}`,
                title: task.title,
                date: task.due_date,
                type: "task",
                color: task.priority === "high" ? "#ef4444" : "#3b82f6", // red or blue
                details: task
            });
        });
    }

    // 1b. Fetch Completed Tasks (Logs)
    const { data: completedTasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .gte("completed_at", startDateStr)
        .lte("completed_at", endDateStr + "T23:59:59");

    if (completedTasks) {
        completedTasks.forEach(task => {
            if (!task.completed_at) return;
            events.push({
                id: `log-task-${task.id}`,
                title: `✅ Completed: ${task.title}`,
                date: task.completed_at.split("T")[0],
                type: "log",
                color: "#16a34a", // green-600
                details: task
            });
        });
    }

    // 2. Fetch Bills (Due Date)
    const { data: bills } = await supabase
        .from("bills")
        .select("*")
        .eq("user_id", user.id)
        .gte("due_date", startDateStr)
        .lte("due_date", endDateStr);

    if (bills) {
        bills.forEach(bill => {
            events.push({
                id: `bill-${bill.id}`,
                title: `Bill: ${bill.name}`,
                date: bill.due_date,
                type: "bill",
                color: "#f59e0b", // amber
                details: bill
            });
        });
    }

    // 3. Fetch Contacts (Birthdays)
    // Birthdays are recurring, so we fetch all contacts with birthdays and check if they fall in range (month/day)
    const { data: contacts } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
        .not("birthday", "is", null);

    if (contacts) {
        // Iterate days in range to find matching birthdays?
        // Or just iterate contacts and see if their birthday month matches current view?
        // Simple approach: Check if birthday month/day falls within start/end range.
        // Since start/end usually covers a month + padding, we can iterate contacts.

        contacts.forEach(contact => {
            if (!contact.birthday) return;
            const bday = new Date(contact.birthday);
            const bdayMonth = bday.getMonth();
            const bdayDate = bday.getDate();

            // Create a date for this year
            const currentYear = start.getFullYear();
            // We might span two years (Dec-Jan). Check both?

            [currentYear, currentYear + 1, currentYear - 1].forEach(year => {
                const targetDate = new Date(year, bdayMonth, bdayDate);
                if (targetDate >= start && targetDate <= end) {
                    events.push({
                        id: `bday-${contact.id}-${year}`,
                        title: `🎂 ${contact.name}'s Birthday`,
                        date: format(targetDate, "yyyy-MM-dd"),
                        type: "birthday",
                        color: "#ec4899", // pink
                        details: contact
                    });
                }
            });
        });
    }

    // 4. Fetch Habit Logs (Activity)
    // We need to join habit_logs with habits to get name
    const { data: habitLogs } = await supabase
        .from("habit_logs")
        .select(`
            id,
            completed_date,
            habit_id,
            habits (
                name,
                icon
            )
        `)
        .eq("user_id", user.id)
        .gte("completed_date", startDateStr)
        .lte("completed_date", endDateStr);

    if (habitLogs) {
        habitLogs.forEach((log: any) => {
            events.push({
                id: `habit-${log.id}`,
                title: `${log.habits?.icon || "✨"} ${log.habits?.name}`,
                date: log.completed_date,
                type: "habit",
                color: "#22c55e", // green
                details: log
            });
        });
    }

    // 5. Fetch Custom Events
    const { data: customEvents } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDateStr)
        .lte("date", endDateStr);

    if (customEvents) {
        customEvents.forEach(evt => {
            events.push({
                id: `evt-${evt.id}`,
                title: evt.title,
                date: evt.date,
                type: "event",
                color: evt.type === 'meeting' ? '#3b82f6' : evt.type === 'birthday' ? '#ec4899' : '#8b5cf6',
                details: evt
            });
        });
    }

    // 6. Fetch Daily Expenses
    const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, date")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .gte("date", startDateStr)
        .lte("date", endDateStr);

    if (transactions) {
        const dailyExpenses: Record<string, number> = {};
        transactions.forEach(t => {
            const date = t.date.split("T")[0]; // ensure date string
            dailyExpenses[date] = (dailyExpenses[date] || 0) + Number(t.amount);
        });

        Object.entries(dailyExpenses).forEach(([date, amount]) => {
            events.push({
                id: `finance-${date}`,
                title: `Spent: ${amount}`,
                date: date,
                type: "finance",
                color: "#ef4444", // red text usually
                details: { amount },
                isTotal: true
            });
        });
    }

    return events;
}
