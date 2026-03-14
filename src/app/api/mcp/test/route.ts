import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { server_url, api_key, transport } = body;

    if (!server_url) {
        return NextResponse.json({ error: "server_url is required" }, { status: 400 });
    }

    try {
        // Validate URL format first
        const url = new URL(server_url);

        // Build headers
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        };
        if (api_key) {
            headers["Authorization"] = `Bearer ${api_key}`;
        }

        // Send MCP initialize request (JSON-RPC 2.0)
        const initPayload = {
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: { name: "daily-tracker", version: "1.0.0" },
            },
        };

        const initRes = await fetch(url.toString(), {
            method: "POST",
            headers,
            body: JSON.stringify(initPayload),
            signal: AbortSignal.timeout(10000),
        });

        if (!initRes.ok) {
            return NextResponse.json({
                success: false,
                tools: [],
                error: `Server responded with ${initRes.status}: ${initRes.statusText}`,
            });
        }

        const initData = await initRes.json();
        if (initData.error) {
            return NextResponse.json({
                success: false,
                tools: [],
                error: initData.error.message || "Initialize failed",
            });
        }

        // Get session ID from response headers (Streamable HTTP transport)
        const sessionId = initRes.headers.get("mcp-session-id");

        // List tools
        const listPayload = {
            jsonrpc: "2.0",
            id: 2,
            method: "tools/list",
            params: {},
        };

        const listHeaders = { ...headers };
        if (sessionId) listHeaders["mcp-session-id"] = sessionId;

        const listRes = await fetch(url.toString(), {
            method: "POST",
            headers: listHeaders,
            body: JSON.stringify(listPayload),
            signal: AbortSignal.timeout(10000),
        });

        if (!listRes.ok) {
            // Connection works but tool listing failed - still a success
            return NextResponse.json({ success: true, tools: [] });
        }

        const listData = await listRes.json();
        const tools = (listData.result?.tools || []).map((t: any) => ({
            name: t.name,
            description: t.description || "",
            inputSchema: t.inputSchema || {},
        }));

        return NextResponse.json({ success: true, tools });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            tools: [],
            error: error.message || "Connection failed",
        });
    }
}
