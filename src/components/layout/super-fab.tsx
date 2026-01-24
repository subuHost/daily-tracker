"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Camera, Mic, Type, Check, X } from "lucide-react";
import { useHaptic } from "@/hooks/use-haptic";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RadialAction {
    id: string;
    icon: React.ElementType;
    label: string;
    color: string;
    onClick: () => void;
}

export function SuperFab() {
    const [isOpen, setIsOpen] = useState(false);
    const haptic = useHaptic();

    const toggleMenu = () => {
        if (!isOpen) {
            haptic.triggerTap();
        } else {
            haptic.triggerTap(); // Light tap on close too
        }
        setIsOpen(!isOpen);
    };

    const handleAction = (label: string, action: () => void) => {
        haptic.triggerSuccess();
        action();
        setIsOpen(false);
    };

    const actions: RadialAction[] = [
        {
            id: "camera",
            icon: Camera,
            label: "Scan Receipt",
            color: "bg-blue-500",
            onClick: () => toast.info("Camera started", { description: "AI Receipt Scanner ready" }),
        },
        {
            id: "mic",
            icon: Mic,
            label: "Voice Log",
            color: "bg-red-500",
            onClick: () => toast.info("Listening...", { description: "Whisper AI recording started" }),
        },
        {
            id: "text",
            icon: Type,
            label: "Quick Note",
            color: "bg-orange-500",
            onClick: () => toast.info("Note editor opened", { description: "Type your natural language log" }),
        },
        {
            id: "habit",
            icon: Check,
            label: "Quick Habit",
            color: "bg-green-500",
            onClick: () => toast.success("Habit Logged", { description: "Quick habit check-in complete" }),
        },
    ];

    // Radial position calculations (fan out 90 degrees, top-left direction from bottom-right)
    // We want them to fan out in an arc.
    // Let's place them at diverse angles.
    // 0 is right, 180 is left, 270 is up.
    // We want angles between 180 (left) and 270 (up).
    // Let's distribute 4 items: 
    // Item 1: 270 (Up)
    // Item 2: 240
    // Item 3: 210
    // Item 4: 180 (Left)

    // Distance from center
    const radius = 80;

    const getItemVariants = (index: number, total: number) => {
        // Distribute between 180 and 270 degrees
        const startAngle = 180;
        const endAngle = 270;
        const step = (endAngle - startAngle) / (total - 1);
        const angle = startAngle + (index * step);
        const radian = (angle * Math.PI) / 180;

        const x = Math.cos(radian) * radius;
        const y = Math.sin(radian) * radius;

        return {
            hidden: { x: 0, y: 0, scale: 0, opacity: 0 },
            visible: {
                x,
                y,
                scale: 1,
                opacity: 1,
                transition: {
                    type: "spring" as const,
                    stiffness: 300,
                    damping: 20,
                    delay: index * 0.05
                }
            },
            exit: { x: 0, y: 0, scale: 0, opacity: 0 }
        };
    };

    return (
        <>
            {/* Backdrop Blur */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-[55] bg-background/80 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Container fixed in bottom right */}
            <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 md:bottom-8 md:right-8 z-[60] flex items-center justify-center">

                {/* Radial Items */}
                <AnimatePresence>
                    {isOpen && actions.map((action, index) => (
                        <motion.div
                            key={action.id}
                            variants={getItemVariants(index, actions.length)}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="absolute"
                        >
                            <button
                                onClick={() => handleAction(action.label, action.onClick)}
                                className={cn(
                                    "flex flex-col items-center gap-1 group"
                                )}
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-12 h-12 rounded-full text-white shadow-lg transition-transform active:scale-95",
                                    action.color
                                )}>
                                    <action.icon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-background/90 backdrop-blur-md border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden sm:block">
                                    {action.label}
                                </span>
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Main Trigger Button */}
                <motion.button
                    onClick={toggleMenu}
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className={cn(
                        "flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-colors ring-2 ring-background",
                        isOpen
                            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                >
                    <Plus className="w-7 h-7" />
                    <span className="sr-only">Toggle Menu</span>
                </motion.button>
            </div>
        </>
    );
}
