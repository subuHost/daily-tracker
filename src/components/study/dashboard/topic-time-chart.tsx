"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface TopicTimeSummary {
    topic: string;
    totalMinutes: number;
    attemptCount: number;
}

interface TopicTimeChartProps {
    data: TopicTimeSummary[];
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#06b6d4"];

export function TopicTimeChart({ data }: TopicTimeChartProps) {
    // Sort by time spent
    const sortedData = [...data]
        .sort((a, b) => b.totalMinutes - a.totalMinutes)
        .slice(0, 10); // Top 10

    const formattedData = sortedData.map(item => ({
        ...item,
        displayTime: (item.totalMinutes / 60).toFixed(1),
    }));

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground border rounded-lg border-dashed">
                <p className="text-sm font-medium">No study time recorded yet.</p>
                <p className="text-xs">Start logging attempts to see your breakdown.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={formattedData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" opacity={0.5} />
                    <XAxis
                        type="number"
                        hide
                    />
                    <YAxis
                        dataKey="topic"
                        type="category"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        width={100}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            fontSize: '12px'
                        }}
                        formatter={(value: any, name: any, props: any) => [
                            `${(props.payload.totalMinutes / 60).toFixed(1)}h (${props.payload.attemptCount} problems)`,
                            "Study Time"
                        ]}
                        cursor={{ fill: 'transparent' }}
                    />
                    <Bar
                        dataKey="totalMinutes"
                        name="Time (min)"
                        radius={[0, 4, 4, 0]}
                        barSize={18}
                    >
                        {formattedData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
