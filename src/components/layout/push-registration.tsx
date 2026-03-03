'use client';

import { useEffect } from 'react';
import { updateNotificationSettings } from '@/app/actions/notifications';

export function PushRegistration() {
    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.register('/sw.js')
                .then(function (registration) {
                    console.log('Service Worker registered with scope:', registration.scope);
                    return registration.pushManager.getSubscription();
                })
                .then(function (subscription) {
                    if (subscription) {
                        // Already subscribed, sync with server if needed
                        // (Optional: Periodic re-sync logic here)
                    }
                })
                .catch(function (error) {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }, []);

    return null; // This component doesn't render anything visible
}
