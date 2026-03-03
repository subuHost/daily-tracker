"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    MoreVertical,
    FolderPlus,
    MessageSquare,
    Trash2,
    Edit2,
    Check,
    X,
    Folder,
    ChevronDown,
    ChevronRight,
    Search,
    Loader2,
    Pin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
    getChatFolders,
    getChatSessions,
    createChatFolder,
    createChatSession,
    deleteChatSession,
    updateChatSessionTitle,
    togglePinSession,
    moveSessionToFolder
} from "@/app/actions/ai";
import { toast } from "sonner";

interface ChatFolder {
    id: string;
    name: string;
    color: string;
    user_id?: string;
    created_at?: string;
}

interface ChatSession {
    id: string;
    title: string;
    folder_id: string | null;
    is_pinned: boolean;
    model?: string;
    user_id?: string;
    created_at?: string;
    updated_at?: string;
}

interface ChatSidebarProps {
    activeSessionId?: string;
    onSessionSelect: (id: string) => void;
    onNewChat: () => void;
}

export function ChatSidebar({ activeSessionId, onSessionSelect, onNewChat }: ChatSidebarProps) {
    const [folders, setFolders] = useState<ChatFolder[]>([]);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // New folder/session UI state
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editSessionTitle, setEditSessionTitle] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        try {
            const [fetchedFolders, fetchedSessions] = await Promise.all([
                getChatFolders(),
                getChatSessions()
            ]);
            setFolders(fetchedFolders);
            setSessions(fetchedSessions);
        } catch (error) {
            console.error("Failed to load chat sidebar data:", error);
            toast.error("Failed to load chat history");
        } finally {
            setIsLoading(false);
        }
    }

    const toggleFolder = (folderId: string) => {
        const next = new Set(expandedFolders);
        if (next.has(folderId)) next.delete(folderId);
        else next.add(folderId);
        setExpandedFolders(next);
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            const folder = await createChatFolder(newFolderName);
            setFolders([...folders, folder]);
            setNewFolderName("");
            setIsCreatingFolder(false);
            toast.success("Folder created");
        } catch (error) {
            toast.error("Failed to create folder");
        }
    };

    const handleDeleteSession = async (id: string) => {
        if (!confirm("Are you sure you want to delete this chat?")) return;
        try {
            await deleteChatSession(id);
            setSessions(sessions.filter(s => s.id !== id));
            toast.success("Chat deleted");
        } catch (error) {
            toast.error("Failed to delete chat");
        }
    };

    const handleStartRename = (session: ChatSession) => {
        setEditingSessionId(session.id);
        setEditSessionTitle(session.title);
    };

    const handleSaveRename = async () => {
        if (!editingSessionId || !editSessionTitle.trim()) return;
        try {
            await updateChatSessionTitle(editingSessionId, editSessionTitle);
            setSessions(sessions.map(s => s.id === editingSessionId ? { ...s, title: editSessionTitle } : s));
            setEditingSessionId(null);
            toast.success("Title updated");
        } catch (error) {
            toast.error("Failed to update title");
        }
    };

    const handleTogglePin = async (id: string) => {
        try {
            await togglePinSession(id);
            setSessions(sessions.map(s => s.id === id ? { ...s, is_pinned: !s.is_pinned } : s));
            toast.success("Updated pin status");
        } catch (error) {
            toast.error("Failed to toggle pin");
        }
    };

    const handleMoveToFolder = async (id: string, folderId: string | null) => {
        try {
            await moveSessionToFolder(id, folderId);
            setSessions(sessions.map(s => s.id === id ? { ...s, folder_id: folderId } : s));
            toast.success(folderId ? "Moved to folder" : "Removed from folder");
        } catch (error) {
            toast.error("Failed to move session");
        }
    };

    const filteredSessions = sessions.filter(s =>
        s?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sessionsInFolders = folders.reduce((acc, folder) => {
        const folderSessions = filteredSessions.filter(s => s.folder_id === folder.id);
        acc[folder.id] = [...folderSessions].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));
        return acc;
    }, {} as Record<string, ChatSession[]>);

    const straySessions = filteredSessions.filter(s => !s.folder_id);
    const sortedStraySessions = [...straySessions].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));

    return (
        <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <Button
                    className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={onNewChat}
                >
                    <Plus className="h-4 w-4" />
                    New Chat
                </Button>

                <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 bg-white dark:bg-slate-800 text-xs border-slate-200 dark:border-slate-700"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <>
                        {/* Folders */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between px-2 mb-1">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Folders</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 rounded-full"
                                    onClick={() => setIsCreatingFolder(true)}
                                >
                                    <FolderPlus className="h-3 w-3" />
                                </Button>
                            </div>

                            {isCreatingFolder && (
                                <div className="px-2 pb-2">
                                    <div className="flex items-center gap-1">
                                        <Input
                                            value={newFolderName}
                                            onChange={(e) => setNewFolderName(e.target.value)}
                                            placeholder="Folder name..."
                                            autoFocus
                                            className="h-8 text-xs bg-white dark:bg-slate-800"
                                            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                                        />
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleCreateFolder}>
                                            <Check className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setIsCreatingFolder(false)}>
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {folders.map(folder => (
                                <div key={folder.id} className="space-y-1">
                                    <button
                                        onClick={() => toggleFolder(folder.id)}
                                        className="w-full flex items-center gap-2 p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-lg text-sm text-slate-600 dark:text-slate-400 transition-colors"
                                    >
                                        {expandedFolders.has(folder.id) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                        <Folder className="h-3.5 w-3.5" style={{ color: folder.color }} />
                                        <span className="flex-1 text-left truncate">{folder.name}</span>
                                        <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                                            {sessionsInFolders[folder.id]?.length || 0}
                                        </span>
                                    </button>

                                    {expandedFolders.has(folder.id) && (
                                        <div className="pl-6 space-y-1 border-l border-slate-200 dark:border-slate-800 ml-4.5">
                                            {sessionsInFolders[folder.id]?.map(session => (
                                                <SessionItem
                                                    key={session.id}
                                                    session={session}
                                                    isActive={activeSessionId === session.id}
                                                    onSelect={onSessionSelect}
                                                    onDelete={handleDeleteSession}
                                                    onRename={handleStartRename}
                                                    isEditing={editingSessionId === session.id}
                                                    editTitle={editSessionTitle}
                                                    onEditChange={setEditSessionTitle}
                                                    onEditSave={handleSaveRename}
                                                    onEditCancel={() => setEditingSessionId(null)}
                                                    onPin={handleTogglePin}
                                                    onMoveToFolder={handleMoveToFolder}
                                                    folders={folders}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Recent Chats (Unfolded) */}
                        <div className="space-y-1">
                            <span className="px-2 mb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Recent Chats</span>
                            {sortedStraySessions.map(session => (
                                <SessionItem
                                    key={session.id}
                                    session={session}
                                    isActive={activeSessionId === session.id}
                                    onSelect={onSessionSelect}
                                    onDelete={handleDeleteSession}
                                    onRename={handleStartRename}
                                    isEditing={editingSessionId === session.id}
                                    editTitle={editSessionTitle}
                                    onEditChange={setEditSessionTitle}
                                    onEditSave={handleSaveRename}
                                    onEditCancel={() => setEditingSessionId(null)}
                                    onPin={handleTogglePin}
                                    onMoveToFolder={handleMoveToFolder}
                                    folders={folders}
                                />
                            ))}
                            {sortedStraySessions.length === 0 && !isLoading && (
                                <div className="text-[10px] text-slate-400 text-center py-4 italic">No chats found.</div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
                <span>Gemini 1.5 Flash</span>
                <span className="text-blue-500 font-medium">Pro Assistant</span>
            </div>
        </div>
    );
}

interface SessionItemProps {
    session: ChatSession;
    isActive: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onRename: (session: ChatSession) => void;
    isEditing: boolean;
    editTitle: string;
    onEditChange: (title: string) => void;
    onEditSave: () => void;
    onEditCancel: () => void;
    onPin: (id: string) => void;
    onMoveToFolder: (id: string, folderId: string | null) => void;
    folders: ChatFolder[];
}

function SessionItem({
    session,
    isActive,
    onSelect,
    onDelete,
    onRename,
    isEditing,
    editTitle,
    onEditChange,
    onEditSave,
    onEditCancel,
    onPin,
    onMoveToFolder,
    folders
}: SessionItemProps) {
    if (isEditing) {
        return (
            <div className="flex items-center gap-1 p-1">
                <Input
                    value={editTitle}
                    onChange={(e) => onEditChange(e.target.value)}
                    className="h-7 text-xs bg-white dark:bg-slate-800"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && onEditSave()}
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={onEditSave}>
                    <Check className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={onEditCancel}>
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "group flex items-center gap-2 p-2 rounded-lg text-sm cursor-pointer transition-all",
                isActive
                    ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm border border-slate-200 dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            )}
            onClick={() => onSelect(session.id)}
        >
            <div className="relative">
                <MessageSquare className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-blue-600" : "text-slate-400")} />
                {session.is_pinned && (
                    <div className="absolute -top-1.5 -right-1.5 bg-blue-500 rounded-full p-0.5 shadow-sm border border-white dark:border-slate-800">
                        <Pin className="h-2 w-2 text-white fill-white" />
                    </div>
                )}
            </div>
            <span className="flex-1 truncate">{session.title}</span>

            <div className="opacity-0 group-hover:opacity-100 flex items-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700">
                            <MoreVertical className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-xs">
                        <DropdownMenuItem onClick={() => onRename(session)}>
                            <Edit2 className="h-3 w-3 mr-2" />
                            Rename
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => onPin(session.id)}>
                            <Pin className={cn("h-3 w-3 mr-2", session.is_pinned && "fill-current")} />
                            {session.is_pinned ? "Unpin" : "Pin"}
                        </DropdownMenuItem>

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Folder className="h-3 w-3 mr-2" />
                                <span>Move to...</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="text-xs">
                                {folders.map(f => (
                                    <DropdownMenuItem
                                        key={f.id}
                                        onClick={() => onMoveToFolder(session.id, f.id)}
                                        disabled={session.folder_id === f.id}
                                    >
                                        <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: f.color }} />
                                        {f.name}
                                    </DropdownMenuItem>
                                ))}
                                {session.folder_id && (
                                    <>
                                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                                        <DropdownMenuItem onClick={() => onMoveToFolder(session.id, null)}>
                                            <X className="h-3 w-3 mr-2" />
                                            Remove from folder
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(session.id)}>
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
