"use client";

/**
 * useHaptic - Custom hook for haptic feedback using the Web Vibration API
 * Provides tactile feedback for a more native-like experience on supported devices.
 */
export function useHaptic() {
    const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

    /**
     * Trigger a success haptic - short crisp tick
     */
    const triggerSuccess = () => {
        if (isSupported) {
            navigator.vibrate(10);
        }
    };

    /**
     * Trigger a warning haptic - double buzz
     */
    const triggerWarning = () => {
        if (isSupported) {
            navigator.vibrate([50, 30, 50]);
        }
    };

    /**
     * Trigger an error haptic - longer buzz
     */
    const triggerError = () => {
        if (isSupported) {
            navigator.vibrate([100, 50, 100]);
        }
    };

    /**
     * Trigger a light tap - for swipe snaps and interactions
     */
    const triggerTap = () => {
        if (isSupported) {
            navigator.vibrate(5);
        }
    };

    /**
     * Trigger a heavy impact - for delete actions
     */
    const triggerImpact = () => {
        if (isSupported) {
            navigator.vibrate(30);
        }
    };

    return {
        isSupported,
        triggerSuccess,
        triggerWarning,
        triggerError,
        triggerTap,
        triggerImpact,
    };
}
