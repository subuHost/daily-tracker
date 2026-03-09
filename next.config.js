const withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
    customWorkerSrc: "src/worker",
    workboxOptions: {
        runtimeCaching: [
            // Static assets — CacheFirst (immutable, content-hashed)
            {
                urlPattern: /\/_next\/static\/.*/i,
                handler: "CacheFirst",
                options: {
                    cacheName: "static-assets",
                    expiration: {
                        maxEntries: 200,
                        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
                    },
                },
            },
            // Fonts — CacheFirst
            {
                urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
                handler: "CacheFirst",
                options: {
                    cacheName: "google-fonts",
                    expiration: {
                        maxEntries: 20,
                        maxAgeSeconds: 365 * 24 * 60 * 60,
                    },
                },
            },
            // Images — CacheFirst
            {
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
                handler: "CacheFirst",
                options: {
                    cacheName: "images",
                    expiration: {
                        maxEntries: 100,
                        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                    },
                },
            },
            // Auth routes — NetworkOnly (must always go through server for auth checks)
            {
                urlPattern: /\/auth\/.*/i,
                handler: "NetworkOnly",
            },
            // API routes — NetworkOnly (always fresh data)
            {
                urlPattern: /\/api\/.*/i,
                handler: "NetworkOnly",
            },
            // Supabase REST calls — NetworkFirst
            {
                urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
                handler: "NetworkFirst",
                options: {
                    cacheName: "supabase-rest",
                    networkTimeoutSeconds: 3,
                    expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 60 * 60, // 1 hour
                    },
                },
            },
            // Page navigations — NetworkFirst with timeout
            // So auth redirects still work when online, but offline shell loads from cache
            {
                urlPattern: /^https?.*/,
                handler: "NetworkFirst",
                options: {
                    cacheName: "pages",
                    networkTimeoutSeconds: 3,
                    expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 24 * 60 * 60, // 1 day
                    },
                },
            },
        ],
    },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
        ],
    },
    // Increase server action body size limit for image uploads
    experimental: {
        serverActions: {
            bodySizeLimit: '4mb',
        },
    },
};

module.exports = withPWA(nextConfig);
