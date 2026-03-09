/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

/**
 * Custom Service Worker — Push Notification Handlers
 *
 * This file is merged into the Workbox-generated service worker by
 * @ducanh2912/next-pwa via the `customWorkerSrc` option.
 *
 * It preserves the push notification functionality from the old
 * hand-crafted public/sw.js while letting Workbox handle caching.
 */

// Handle incoming push notifications
self.addEventListener("push", (event: PushEvent) => {
    if (event.data) {
        const data = event.data.json();
        const { title, body, action_url } = data;

        const options: NotificationOptions = {
            body: body,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            data: {
                action_url: action_url || "/notifications",
            },
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    }
});

// Handle notification clicks — open/focus the app
self.addEventListener("notificationclick", (event: NotificationEvent) => {
    event.notification.close();

    const actionUrl = event.notification.data?.action_url || "/";

    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                // Try to focus an existing window
                for (const client of clientList) {
                    if ("focus" in client) {
                        return client.focus();
                    }
                }
                // Otherwise open a new window
                if (self.clients.openWindow) {
                    return self.clients.openWindow(actionUrl);
                }
            })
    );
});

export { };
