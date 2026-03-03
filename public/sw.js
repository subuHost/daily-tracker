// Tech Plan — Phase 6C: Notification System
// Service Worker for Push Notifications

self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        const { title, body, action_url } = data;

        const options = {
            body: body,
            icon: '/icons/icon-192x192.png', // Assuming icons exist
            badge: '/icons/badge-72x72.png',
            data: {
                action_url: action_url || '/notifications'
            }
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const actionUrl = event.notification.data.action_url;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(actionUrl);
            }
        })
    );
});
