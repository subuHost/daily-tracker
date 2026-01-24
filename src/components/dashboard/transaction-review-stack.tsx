"use client";

import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from "framer-motion";
import { Check, X, Building2, Receipt, PartyPopper } from "lucide-react";
import { Transaction, getReviewTransactions, verifyTransaction } from "@/lib/db";
import { useHaptic } from "@/hooks/use-haptic";
import confetti from "canvas-confetti";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export function TransactionReviewStack() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const haptic = useHaptic();

    // Load transactions that need review
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // For demo purposes, if no transactions need review, we might want to mock some or specific behavior?
            // User requested: "for transactions with the status needs_review".
            const data = await getReviewTransactions();
            setTransactions(data);

            // DEMO MODE: If empty, maybe show empty state directly?
            // "Feedback: Add a 'Confetti' explosion effect when the stack is empty (Inbox Zero moment)."
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwipe = async (id: string, direction: "left" | "right") => {
        // Remove from local state immediately for UI responsiveness
        setTransactions(prev => prev.filter(t => t.id !== id));

        if (direction === "right") {
            // Confirm/Verify
            haptic.triggerSuccess();
            try {
                await verifyTransaction(id);
                toast.success("Transaction verified");
            } catch (e) {
                toast.error("Failed to verify");
                // In real app, might want to revert UI if failed
            }
        } else {
            // Flag/Manual Review
            haptic.triggerWarning();
            toast.info("Flagged for manual review", {
                action: {
                    label: "Edit",
                    onClick: () => console.log("Open edit modal for", id)
                }
            });
        }

        // Check for Inbox Zero
        if (transactions.length <= 1) { // We just removed one, so if length was 1 (now 0)
            triggerConfetti();
        }
    };

    const triggerConfetti = () => {
        haptic.triggerSuccess();
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    };

    if (isLoading) return null; // Or skeleton

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-card rounded-lg border border-dashed h-64">
                <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-4">
                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-1">All Caught Up!</h3>
                <p className="text-sm text-muted-foreground text-center">
                    No transactions to review.
                </p>
                <Button variant="ghost" size="sm" onClick={loadData} className="mt-4">
                    Refresh
                </Button>
            </div>
        );
    }

    // Pass the top card data
    return (
        <div className="relative h-72 w-full flex items-center justify-center">
            <AnimatePresence>
                {transactions.map((transaction, index) => {
                    // Only render the top 2 cards for performance
                    if (index > 1) return null;
                    const isTop = index === 0;

                    return (
                        <SwipeableCard
                            key={transaction.id}
                            transaction={transaction}
                            onSwipe={(dir) => handleSwipe(transaction.id, dir)}
                            active={isTop}
                            index={index}
                        />
                    );
                }).reverse()}
            </AnimatePresence>
        </div>
    );
}

interface SwipeableCardProps {
    transaction: Transaction;
    onSwipe: (dir: "left" | "right") => void;
    active: boolean;
    index: number;
}

function SwipeableCard({ transaction, onSwipe, active, index }: SwipeableCardProps) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

    // Background color indicators
    const bgRight = useTransform(x, [0, 100], ["rgba(34, 197, 94, 0)", "rgba(34, 197, 94, 0.2)"]); // Green
    const bgLeft = useTransform(x, [-100, 0], ["rgba(239, 68, 68, 0.2)", "rgba(239, 68, 68, 0)"]); // Red

    // Icon scales
    const checkScale = useTransform(x, [50, 100], [0, 1.2]);
    const crossScale = useTransform(x, [-100, -50], [1.2, 0]);

    const haptic = useHaptic();

    const handleDragEnd = (_: any, info: PanInfo) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            onSwipe("right");
        } else if (info.offset.x < -threshold) {
            onSwipe("left");
        }
    };

    return (
        <motion.div
            style={{
                x: active ? x : 0,
                rotate: active ? rotate : 0,
                opacity: index === 0 ? 1 : 1 - (index * 0.05), // Fade cards behind
                scale: 1 - (index * 0.05), // Scale down cards behind
                y: index * 10, // Stack vertically slightly
                zIndex: 100 - index,
            }}
            drag={active ? "x" : false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1 - (index * 0.05), opacity: 1, y: index * 10 }}
            exit={{
                x: x.get() < 0 ? -200 : 200,
                opacity: 0,
                transition: { duration: 0.2 }
            }}
            className="absolute w-full max-w-sm cursor-grab active:cursor-grabbing"
            whileTap={{ scale: 1.02 }}
        >
            <Card className="h-64 shadow-xl overflow-hidden relative">
                {/* Swipe Overlays */}
                <motion.div style={{ backgroundColor: bgRight }} className="absolute inset-0 z-10 pointer-events-none flex items-center justify-start pl-8">
                    <motion.div style={{ scale: checkScale }}>
                        <div className="bg-green-500 rounded-full p-4">
                            <Check className="h-8 w-8 text-white" />
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div style={{ backgroundColor: bgLeft }} className="absolute inset-0 z-10 pointer-events-none flex items-center justify-end pr-8">
                    <motion.div style={{ scale: crossScale }}>
                        <div className="bg-red-500 rounded-full p-4">
                            <X className="h-8 w-8 text-white" />
                        </div>
                    </motion.div>
                </motion.div>

                <CardContent className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>

                    <div>
                        <h3 className="font-bold text-xl">{transaction.description}</h3>
                        <p className="text-muted-foreground text-sm">{new Date(transaction.date).toLocaleDateString()}</p>
                    </div>

                    <div className="py-2">
                        <span className="text-3xl font-bold">{formatCurrency(transaction.amount)}</span>
                    </div>

                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                        {transaction.category_name || "Uncategorized"}
                    </div>

                    <p className="text-xs text-muted-foreground pt-2">
                        Suggested by AI
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );
}
