// Tech Plan — Phase 6C: Notification System
// Supabase Edge Function: push-dispatcher
// Handles sending Web Push notifications to user devices

import { createClient } from "supabase";
import webpush from "webpush";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Payload from Database Webhook (INSERT into notifications)
        const body = await req.json().catch(() => ({}));
        const record = body?.record;

        if (!record || !record.user_id) {
            return new Response(JSON.stringify({ error: "No record found" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400
            });
        }

        const { user_id, title, body: notifBody, action_url } = record;

        // Fetch user's push subscriptions
        const { data: subscriptions, error: subError } = await supabaseClient
            .from("push_subscriptions")
            .select("*")
            .eq("user_id", user_id);

        if (subError) throw subError;
        if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({ message: "No subscriptions found" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200
            });
        }

        // Configure Web Push
        const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
        const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
        const subject = Deno.env.get("VAPID_SUBJECT") || "mailto:example@your-domain.com";

        if (!vapidPublicKey || !vapidPrivateKey) {
            throw new Error("VAPID keys not configured in Edge Function secrets");
        }

        webpush.setVapidDetails(subject, vapidPublicKey, vapidPrivateKey);

        const payload = JSON.stringify({
            title,
            body: notifBody,
            action_url: action_url || "/notifications"
        });

        const results = await Promise.all(
            subscriptions.map(async (sub) => {
                try {
                    const pushSubscription = {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth_key
                        }
                    };

                    await webpush.sendNotification(pushSubscription, payload);

                    // Update last_used_at
                    await supabaseClient
                        .from("push_subscriptions")
                        .update({ last_used_at: new Date().toISOString() })
                        .eq("id", sub.id);

                    return { id: sub.id, status: "success" };
                } catch (err: any) {
                    console.error(`Error sending to subscription ${sub.id}:`, err);

                    // If 410 Gone or 404 Not Found, delete the subscription
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await supabaseClient
                            .from("push_subscriptions")
                            .delete()
                            .eq("id", sub.id);
                        return { id: sub.id, status: "removed" };
                    }

                    return { id: sub.id, status: "error", error: err.message };
                }
            })
        );

        return new Response(JSON.stringify({ results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("Fatal error in push-dispatcher:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
