"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, X, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveUserPreferences, UserPreferences } from "@/app/actions/preferences";
import { DashboardCustomizeDrawer } from "./dashboard-customize-drawer";

export const WIDGET_REGISTRY = [
    { id: "budget", label: "Monthly Budget", description: "Track your income and spending" },
    { id: "tasks", label: "My Tasks", description: "View and manage your to-do list" },
    { id: "events", label: "Calendar Events", description: "Upcoming meetings and events" },
    { id: "net-worth", label: "Total Net Worth", description: "Overview of your assets" },
    { id: "expenses", label: "Recent Expenses", description: "Last 10 transactions" },
    { id: "health", label: "Health & Nutrition", description: "Calories, sleep, and water" },
    { id: "habits", label: "Daily Habits", description: "Track your consistency" },
    { id: "transactions", label: "Pending Review", description: "Categorize new transactions" },
    { id: "quick-links", label: "Quick Links", description: "Fast access to frequent actions" },
];

interface SortableItemProps {
    id: string;
    children: React.ReactNode;
    onHide: (id: string) => void;
}

function SortableItem({ id, children, onHide }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${isDragging ? "ring-2 ring-primary border-primary" : ""
                }`}
        >
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div
                    {...attributes}
                    {...listeners}
                    className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground bg-background/80 rounded-md border backdrop-blur-sm"
                >
                    <GripVertical className="h-4 w-4" />
                </div>
            </div>
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onHide(id)}
                    className="p-1 text-muted-foreground hover:text-destructive bg-background/80 rounded-md border backdrop-blur-sm"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="h-full w-full">{children}</div>
        </div>
    );
}

interface DashboardWidgetGridProps {
    widgets: Record<string, React.ReactNode>;
    preferences: UserPreferences | null;
}

export function DashboardWidgetGrid({ widgets, preferences }: DashboardWidgetGridProps) {
    const [order, setOrder] = useState<string[]>([]);
    const [hidden, setHidden] = useState<Set<string>>(new Set());
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        const defaultOrder = WIDGET_REGISTRY.map((w) => w.id);
        const savedOrder = preferences?.widget_order || defaultOrder;

        // Ensure all registered widgets are in the order
        const fullOrder = [...savedOrder];
        defaultOrder.forEach(id => {
            if (!fullOrder.includes(id)) fullOrder.push(id);
        });

        setOrder(fullOrder);
        setHidden(new Set(preferences?.hidden_widgets || []));
    }, [preferences]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setOrder((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                const newOrder = arrayMove(items, oldIndex, newIndex);

                // Persist order
                saveUserPreferences({ widget_order: newOrder });

                return newOrder;
            });
        }
    };

    const handleHide = (id: string) => {
        setHidden((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);

            // Persist visibility
            saveUserPreferences({ hidden_widgets: Array.from(next) });

            return next;
        });
    };

    const visibleOrder = order.filter((id) => !hidden.has(id) && widgets[id]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="hidden md:block">
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Organize your widgets exactly how you like them.
                    </p>
                </div>
                <div className="md:hidden">
                    <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsDrawerOpen(true)}
                >
                    <Settings2 className="h-4 w-4" />
                    Customize
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                    <SortableContext items={visibleOrder} strategy={rectSortingStrategy}>
                        <AnimatePresence mode="popLayout">
                            {visibleOrder.map((id) => (
                                <motion.div
                                    key={id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className={id === "transactions" ? "lg:col-span-1" : ""}
                                >
                                    <SortableItem id={id} onHide={handleHide}>
                                        {widgets[id]}
                                    </SortableItem>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </SortableContext>
                </div>
            </DndContext>

            <DashboardCustomizeDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                hiddenWidgets={hidden}
                onToggle={handleHide}
                widgetOrder={order}
                onReorder={(newOrder) => {
                    setOrder(newOrder);
                    saveUserPreferences({ widget_order: newOrder });
                }}
            />
        </div>
    );
}
