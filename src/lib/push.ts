'use client';

// Tech Plan — Phase 6C: Notification System
// Push notification utilities

export async function requestPushPermission() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.error('Push notifications are not supported in this browser.');
        return { success: false, error: 'Not supported' };
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            return { success: false, error: 'Permission denied' };
        }

        const registration = await navigator.serviceWorker.ready;

        // VAPID public key from env
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
            console.error('Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY');
            return { success: false, error: 'Config error' };
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        // Save to server
        const response = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subscription: subscription,
                userAgent: navigator.userAgent
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save push subscription on server');
        }

        return { success: true };
    } catch (error) {
        console.error('Error enabling push notifications:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Check the current push subscription status and VAPID configuration.
 */
export async function checkPushStatus(): Promise<{ subscribed: boolean; vapidConfigured: boolean; error?: string }> {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidConfigured = !!vapidKey && vapidKey.length > 20;

    if (!vapidConfigured && vapidKey) {
        return { subscribed: false, vapidConfigured: false, error: 'VAPID public key appears malformed (too short). Regenerate with: npx web-push generate-vapid-keys' };
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return { subscribed: false, vapidConfigured, error: 'Push not supported in this browser' };
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        return { subscribed: !!sub, vapidConfigured };
    } catch (error) {
        console.error('Error checking push status:', error);
        return { subscribed: false, vapidConfigured, error: (error as Error).message };
    }
}


function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
