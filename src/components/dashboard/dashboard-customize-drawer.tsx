"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { GripVertical, RotateCcw } from "lucide-react";

import { WIDGET_REGISTRY } from "./dashboard-widget-grid";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableWidgetRowProps {
    id: string;
    label: string;
    isHidden: boolean;
    onToggle: (id: string) => void;
}

function SortableWidgetRow({ id, label, isHidden, onToggle }: SortableWidgetRowProps) {
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
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center justify-between p-3 rounded-lg border bg-card mb-2 ${isDragging ? "ring-2 ring-primary border-primary shadow-lg" : ""
                } ${isHidden ? "opacity-60 bg-muted/50" : ""}`}
        >
            <div className="flex items-center gap-3">
                <div
                    {...attributes}
                    {...listeners}
                    className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                >
                    <GripVertical className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">{label}</span>
            </div>
            <Switch
                checked={!isHidden}
                onCheckedChange={() => onToggle(id)}
            />
        </div>
    );
}

interface DashboardCustomizeDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    hiddenWidgets: Set<string>;
    onToggle: (id: string) => void;
    widgetOrder: string[];
    onReorder: (newOrder: string[]) => void;
}

export function DashboardCustomizeDrawer({
    isOpen,
    onClose,
    hiddenWidgets,
    onToggle,
    widgetOrder,
    onReorder,
}: DashboardCustomizeDrawerProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = widgetOrder.indexOf(active.id as string);
            const newIndex = widgetOrder.indexOf(over.id as string);
            onReorder(arrayMove(widgetOrder, oldIndex, newIndex));
        }
    };

    const handleReset = () => {
        const defaultOrder = WIDGET_REGISTRY.map((w) => w.id);
        onReorder(defaultOrder);
        // Toggle all back to visible
        Array.from(hiddenWidgets).forEach(id => onToggle(id));
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader className="pb-4">
                    <DialogTitle>Customize Dashboard</DialogTitle>
                    <DialogDescription>
                        Drag to reorder widgets and toggle visibility.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto pr-2 py-1">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={widgetOrder} strategy={verticalListSortingStrategy}>
                            {widgetOrder.map((id) => (
                                <SortableWidgetRow
                                    key={id}
                                    id={id}
                                    label={WIDGET_REGISTRY.find((w) => w.id === id)?.label || id}
                                    isHidden={hiddenWidgets.has(id)}
                                    onToggle={onToggle}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>

                <div className="flex justify-between items-center pt-4 border-t mt-4">
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleReset}>
                        <RotateCcw className="h-4 w-4" />
                        Reset All
                    </Button>
                    <Button onClick={onClose}>Done</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
