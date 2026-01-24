"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { ReactNode, useState } from "react";
import { Trash2, Edit2, Check } from "lucide-react";
import { useHaptic } from "@/hooks/use-haptic";

interface SwipeableListItemProps {
    children: ReactNode;
    onDelete?: () => void;
    onEdit?: () => void;
    onComplete?: () => void;
    showComplete?: boolean; // If true, shows Complete instead of Edit on right swipe
    className?: string;
}

const SWIPE_THRESHOLD = 80; // pixels to trigger action
const ACTION_WIDTH = 80;

export function SwipeableListItem({
    children,
    onDelete,
    onEdit,
    onComplete,
    showComplete = false,
    className = "",
}: SwipeableListItemProps) {
    const x = useMotionValue(0);
    const [isDragging, setIsDragging] = useState(false);
    const haptic = useHaptic();

    // Background colors based on swipe direction
    const leftBackgroundOpacity = useTransform(x, [-ACTION_WIDTH * 2, -ACTION_WIDTH, 0], [1, 0.8, 0]);
    const rightBackgroundOpacity = useTransform(x, [0, ACTION_WIDTH, ACTION_WIDTH * 2], [0, 0.8, 1]);

    // Icon scales
    const deleteIconScale = useTransform(x, [-ACTION_WIDTH * 2, -ACTION_WIDTH, 0], [1.2, 1, 0.5]);
    const actionIconScale = useTransform(x, [0, ACTION_WIDTH, ACTION_WIDTH * 2], [0.5, 1, 1.2]);

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setIsDragging(false);
        const { offset, velocity } = info;

        // Swipe left to delete
        if (offset.x < -SWIPE_THRESHOLD || (velocity.x < -500 && offset.x < 0)) {
            haptic.triggerImpact();
            onDelete?.();
            return;
        }

        // Swipe right to edit/complete
        if (offset.x > SWIPE_THRESHOLD || (velocity.x > 500 && offset.x > 0)) {
            haptic.triggerSuccess();
            if (showComplete) {
                onComplete?.();
            } else {
                onEdit?.();
            }
            return;
        }

        // Snap back if not enough swipe
        haptic.triggerTap();
    };

    const handleDragStart = () => {
        setIsDragging(true);
    };

    return (
        <div className={`relative overflow-hidden rounded-lg ${className}`}>
            {/* Delete background (left swipe) */}
            <motion.div
                className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-red-500 rounded-lg"
                style={{ opacity: leftBackgroundOpacity, width: ACTION_WIDTH * 2 }}
            >
                <motion.div style={{ scale: deleteIconScale }}>
                    <Trash2 className="h-6 w-6 text-white" />
                </motion.div>
            </motion.div>

            {/* Edit/Complete background (right swipe) */}
            <motion.div
                className="absolute inset-y-0 left-0 flex items-center justify-start pl-4 bg-green-500 rounded-lg"
                style={{ opacity: rightBackgroundOpacity, width: ACTION_WIDTH * 2 }}
            >
                <motion.div style={{ scale: actionIconScale }}>
                    {showComplete ? (
                        <Check className="h-6 w-6 text-white" />
                    ) : (
                        <Edit2 className="h-6 w-6 text-white" />
                    )}
                </motion.div>
            </motion.div>

            {/* Main content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className={`relative bg-card touch-pan-y ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                whileTap={{ cursor: 'grabbing' }}
            >
                {children}
            </motion.div>
        </div>
    );
}
