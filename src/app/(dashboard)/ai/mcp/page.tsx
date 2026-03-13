"use client";

import { useState, useEffect } from "react";
import {
    Plug,
    Plus,
    Trash2,
    RefreshCw,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
    Eye,
    EyeOff,
    Loader2,
    Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AiHubNav } from "@/components/ai/ai-hub-nav";
import {
    getUserMcpConnections,
    addMcpConnection,
    deleteMcpConnection,
    updateMcpTools,
    toggleMcpConnection,
    type McpConnection,
    type McpConnectionInput,
} from "@/lib/db/mcp";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const PRESETS = [
    {
        name: "Context7",
        server_url: "https://mcp.context7.com/mcp",
        transport: "http" as const,
        description: "Up-to-date library & framework documentation",
    },
    {
        name: "Apify",
        server_url: "https://mcp.apify.com/mcp",
        transport: "http" as const,
        description: "Web scraping & automation tools",
    },
];

export default function McpPage() {
    const [connections, setConnections] = useState<McpConnection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [testingId, setTestingId] = useState<string | null>(null);
    const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
    const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

    const [newConn, setNewConn] = useState<McpConnectionInput>({
        name: "",
        server_url: "",
        api_key: "",
        transport: "http",
    });

    const loadConnections = async () => {
        try {
            const data = await getUserMcpConnections();
            setConnections(data);
        } catch {
            toast.error("Failed to load MCP connections");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadConnections();
    }, []);

    const handleAddPreset = async (preset: typeof PRESETS[0]) => {
        const already = connections.some((c) => c.server_url === preset.server_url);
        if (already) {
            toast.info(`${preset.name} is already connected`);
            return;
        }
        try {
            await addMcpConnection({
                name: preset.name,
                server_url: preset.server_url,
                transport: preset.transport,
            });
            toast.success(`${preset.name} added`);
            loadConnections();
        } catch {
            toast.error("Failed to add connection");
        }
    };

    const handleAddCustom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newConn.name || !newConn.server_url) return;
        setIsAdding(true);
        try {
            await addMcpConnection({
                ...newConn,
                api_key: newConn.api_key || null,
            });
            toast.success("MCP server added");
            setNewConn({ name: "", server_url: "", api_key: "", transport: "http" });
            setShowAddForm(false);
            loadConnections();
        } catch {
            toast.error("Failed to add connection");
        } finally {
            setIsAdding(false);
        }
    };

    const handleTest = async (conn: McpConnection) => {
        setTestingId(conn.id);
        try {
            const res = await fetch("/api/mcp/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    server_url: conn.server_url,
                    api_key: conn.api_key,
                    transport: conn.transport,
                }),
            });
            const data = await res.json();

            if (data.success) {
                await updateMcpTools(conn.id, data.tools || []);
                toast.success(`Connected — found ${data.tools?.length || 0} tools`);
                loadConnections();
            } else {
                toast.error(`Connection failed: ${data.error || "Unknown error"}`);
            }
        } catch {
            toast.error("Test request failed");
        } finally {
            setTestingId(null);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Remove "${name}"?`)) return;
        try {
            await deleteMcpConnection(id);
            toast.success("Connection removed");
            loadConnections();
        } catch {
            toast.error("Failed to remove connection");
        }
    };

    const handleToggle = async (id: string, enabled: boolean) => {
        try {
            await toggleMcpConnection(id, enabled);
            setConnections((prev) =>
                prev.map((c) => (c.id === id ? { ...c, enabled } : c))
            );
        } catch {
            toast.error("Failed to update connection");
        }
    };

    return (
        <div className="flex h-full overflow-hidden">
            {/* AI Hub Nav Sidebar */}
            <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-card">
                <AiHubNav />
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-xl font-semibold">MCP Connections</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Connect external MCP servers to extend AI capabilities
                            </p>
                        </div>
                        <Button
                            size="sm"
                            className="gap-1.5 shrink-0"
                            onClick={() => setShowAddForm(!showAddForm)}
                        >
                            <Plus className="h-4 w-4" />
                            Add Server
                        </Button>
                    </div>

                    {/* Presets */}
                    <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Quick Add
                        </p>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {PRESETS.map((preset) => {
                                const isAdded = connections.some((c) => c.server_url === preset.server_url);
                                return (
                                    <div
                                        key={preset.name}
                                        className="flex items-center justify-between p-4 rounded-xl border bg-card gap-3"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">{preset.name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={isAdded ? "secondary" : "outline"}
                                            className="h-8 shrink-0 text-xs"
                                            onClick={() => handleAddPreset(preset)}
                                            disabled={isAdded}
                                        >
                                            {isAdded ? "Added" : "Add"}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Add Custom Form */}
                    {showAddForm && (
                        <div className="rounded-xl border bg-card p-5 space-y-4">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Plug className="h-4 w-4" />
                                Add Custom MCP Server
                            </h3>
                            <form onSubmit={handleAddCustom} className="space-y-3">
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Name</Label>
                                        <Input
                                            placeholder="My MCP Server"
                                            value={newConn.name}
                                            onChange={(e) => setNewConn((p) => ({ ...p, name: e.target.value }))}
                                            className="h-9 text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Server URL</Label>
                                        <Input
                                            placeholder="https://example.com/mcp"
                                            value={newConn.server_url}
                                            onChange={(e) => setNewConn((p) => ({ ...p, server_url: e.target.value }))}
                                            className="h-9 text-sm"
                                            type="url"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">API Key (optional)</Label>
                                        <Input
                                            placeholder="Bearer token or API key"
                                            value={newConn.api_key || ""}
                                            onChange={(e) => setNewConn((p) => ({ ...p, api_key: e.target.value }))}
                                            className="h-9 text-sm"
                                            type="password"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Transport</Label>
                                        <div className="flex rounded-lg border overflow-hidden h-9">
                                            {(["http", "sse"] as const).map((t) => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setNewConn((p) => ({ ...p, transport: t }))}
                                                    className={cn(
                                                        "flex-1 text-xs font-medium uppercase transition-colors",
                                                        newConn.transport === t
                                                            ? "bg-primary text-primary-foreground"
                                                            : "bg-card text-muted-foreground hover:bg-accent"
                                                    )}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowAddForm(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" size="sm" disabled={isAdding} className="gap-1.5">
                                        {isAdding && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                        Add Connection
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Connected Servers */}
                    <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Connected Servers ({connections.length})
                        </p>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-12 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                <span className="text-sm">Loading...</span>
                            </div>
                        ) : connections.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
                                <Plug className="h-10 w-10 opacity-20" />
                                <p className="text-sm font-medium">No MCP servers connected</p>
                                <p className="text-xs max-w-xs">
                                    Add a preset above or click &quot;Add Server&quot; to connect a custom MCP server.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {connections.map((conn) => {
                                    const isTesting = testingId === conn.id;
                                    const toolsExpanded = expandedTools[conn.id];
                                    const keyVisible = showApiKey[conn.id];
                                    const hasTested = conn.last_tested_at != null;

                                    return (
                                        <div key={conn.id} className="rounded-xl border bg-card overflow-hidden">
                                            {/* Card header */}
                                            <div className="flex items-center gap-3 p-4">
                                                {/* Status dot */}
                                                <div
                                                    className={cn(
                                                        "w-2 h-2 rounded-full shrink-0",
                                                        !conn.enabled
                                                            ? "bg-muted-foreground"
                                                            : hasTested
                                                            ? "bg-green-500"
                                                            : "bg-amber-400"
                                                    )}
                                                    title={
                                                        !conn.enabled
                                                            ? "Disabled"
                                                            : hasTested
                                                            ? "Connected"
                                                            : "Not tested"
                                                    }
                                                />

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-medium">{conn.name}</span>
                                                        <Badge variant="outline" className="text-[10px] h-4">
                                                            {conn.transport.toUpperCase()}
                                                        </Badge>
                                                        {conn.tools.length > 0 && (
                                                            <Badge variant="secondary" className="text-[10px] h-4 gap-0.5">
                                                                <Zap className="h-2.5 w-2.5" />
                                                                {conn.tools.length} tools
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                        {conn.server_url}
                                                    </p>
                                                    {conn.last_tested_at && (
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                                            Tested {formatDistanceToNow(new Date(conn.last_tested_at), { addSuffix: true })}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Switch
                                                        checked={conn.enabled}
                                                        onCheckedChange={(v) => handleToggle(conn.id, v)}
                                                        className="scale-90"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleTest(conn)}
                                                        disabled={isTesting}
                                                        title="Test connection"
                                                    >
                                                        {isTesting ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <RefreshCw className="h-3.5 w-3.5" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleDelete(conn.id, conn.name)}
                                                        title="Remove"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* API Key row */}
                                            {conn.api_key && (
                                                <div className="px-4 pb-2 flex items-center gap-2">
                                                    <span className="text-[10px] text-muted-foreground">API Key:</span>
                                                    <code className="text-[10px] font-mono">
                                                        {keyVisible ? conn.api_key : "•".repeat(Math.min(conn.api_key.length, 24))}
                                                    </code>
                                                    <button
                                                        onClick={() => setShowApiKey((p) => ({ ...p, [conn.id]: !p[conn.id] }))}
                                                        className="text-muted-foreground hover:text-foreground"
                                                    >
                                                        {keyVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Tools */}
                                            {conn.tools.length > 0 && (
                                                <div>
                                                    <button
                                                        onClick={() => setExpandedTools((p) => ({ ...p, [conn.id]: !p[conn.id] }))}
                                                        className="flex items-center gap-1.5 px-4 pb-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        {toolsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                                        {toolsExpanded ? "Hide" : "Show"} {conn.tools.length} available tools
                                                    </button>
                                                    {toolsExpanded && (
                                                        <div className="border-t px-4 py-3 space-y-2">
                                                            {conn.tools.map((tool) => (
                                                                <div key={tool.name} className="flex items-start gap-2">
                                                                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                                                                    <div>
                                                                        <p className="text-xs font-medium font-mono">{tool.name}</p>
                                                                        {tool.description && (
                                                                            <p className="text-[10px] text-muted-foreground">{tool.description}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Not tested warning */}
                                            {!hasTested && conn.enabled && (
                                                <div className="border-t px-4 py-2.5 flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20">
                                                    <XCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                    <span className="text-[11px] text-amber-700 dark:text-amber-400">
                                                        Click the refresh icon to test this connection and discover available tools.
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Info box */}
                    <div className="rounded-xl border bg-muted/30 p-4 space-y-1.5">
                        <p className="text-xs font-semibold">About MCP (Model Context Protocol)</p>
                        <p className="text-xs text-muted-foreground">
                            MCP servers extend AI capabilities with external tools — web scraping, documentation lookup,
                            API integrations, and more. Connected tools become available in the AI Chat once enabled.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
