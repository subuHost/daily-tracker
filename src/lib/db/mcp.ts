import { createClient } from "@/lib/supabase/client";

export interface McpTool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}

export interface McpConnection {
    id: string;
    user_id: string;
    name: string;
    server_url: string;
    api_key: string | null;
    transport: "http" | "sse";
    enabled: boolean;
    tools: McpTool[];
    last_tested_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface McpConnectionInput {
    name: string;
    server_url: string;
    api_key?: string | null;
    transport?: "http" | "sse";
    enabled?: boolean;
}

export async function getUserMcpConnections(): Promise<McpConnection[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("user_mcp_connections")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) throw error;
    return (data || []) as McpConnection[];
}

export async function addMcpConnection(input: McpConnectionInput): Promise<McpConnection> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("user_mcp_connections")
        .insert({
            user_id: user.id,
            name: input.name,
            server_url: input.server_url,
            api_key: input.api_key || null,
            transport: input.transport || "http",
            enabled: input.enabled ?? true,
            tools: [],
        })
        .select()
        .single();

    if (error) throw error;
    return data as McpConnection;
}

export async function updateMcpConnection(
    id: string,
    updates: Partial<McpConnectionInput>
): Promise<McpConnection> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("user_mcp_connections")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data as McpConnection;
}

export async function deleteMcpConnection(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
        .from("user_mcp_connections")
        .delete()
        .eq("id", id);

    if (error) throw error;
}

export async function updateMcpTools(id: string, tools: McpTool[]): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
        .from("user_mcp_connections")
        .update({
            tools,
            last_tested_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) throw error;
}

export async function toggleMcpConnection(id: string, enabled: boolean): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
        .from("user_mcp_connections")
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) throw error;
}
