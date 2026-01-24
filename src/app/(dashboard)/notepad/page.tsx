"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Plus,
    Trash2,
    Save,
    FileText,
    Loader2,
    X,
} from "lucide-react";
import { getNotes, createNote, updateNote, deleteNote, type Note } from "@/lib/db";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function NotepadPage() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            const data = await getNotes();
            setNotes(data);
        } catch (error) {
            console.error("Failed to load notes:", error);
            toast.error("Failed to load notes");
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewNote = () => {
        setSelectedNote(null);
        setTitle("");
        setContent("");
        setIsEditing(true);
    };

    const handleSelectNote = (note: Note) => {
        setSelectedNote(note);
        setTitle(note.title || "");
        setContent(note.content);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!content.trim()) {
            toast.error("Note content is required");
            return;
        }

        setIsSaving(true);
        try {
            if (selectedNote) {
                // Update existing note
                const updated = await updateNote(selectedNote.id, { title, content });
                setNotes(notes.map(n => n.id === updated.id ? updated : n));
                setSelectedNote(updated);
                toast.success("Note updated");
            } else {
                // Create new note
                const created = await createNote({ title, content });
                setNotes([created, ...notes]);
                setSelectedNote(created);
                toast.success("Note created");
            }
        } catch (error) {
            console.error("Save failed:", error);
            toast.error("Failed to save note");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedNote) return;
        if (!confirm("Are you sure you want to delete this note?")) return;

        setIsSaving(true);
        try {
            await deleteNote(selectedNote.id);
            setNotes(notes.filter(n => n.id !== selectedNote.id));
            setSelectedNote(null);
            setTitle("");
            setContent("");
            setIsEditing(false);
            toast.success("Note deleted");
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete note");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setSelectedNote(null);
        setTitle("");
        setContent("");
        setIsEditing(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Notepad</h1>
                    <p className="text-muted-foreground text-sm">Quick notes and scratchpad</p>
                </div>
                <Button onClick={handleNewNote} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    New Note
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Notes List */}
                <Card className="lg:col-span-1 h-fit max-h-[70vh] overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Your Notes ({notes.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 overflow-y-auto max-h-[55vh]">
                        {notes.length > 0 ? (
                            <div className="space-y-1">
                                {notes.map((note) => (
                                    <button
                                        key={note.id}
                                        onClick={() => handleSelectNote(note)}
                                        className={`w-full text-left p-3 rounded-lg transition-colors ${selectedNote?.id === note.id
                                                ? "bg-primary text-primary-foreground"
                                                : "hover:bg-accent"
                                            }`}
                                    >
                                        <p className="font-medium text-sm truncate">
                                            {note.title || "Untitled Note"}
                                        </p>
                                        <p className={`text-xs mt-1 truncate ${selectedNote?.id === note.id
                                                ? "text-primary-foreground/70"
                                                : "text-muted-foreground"
                                            }`}>
                                            {note.content.slice(0, 50)}...
                                        </p>
                                        <p className={`text-[10px] mt-1 ${selectedNote?.id === note.id
                                                ? "text-primary-foreground/50"
                                                : "text-muted-foreground/70"
                                            }`}>
                                            {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No notes yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Editor */}
                <Card className="lg:col-span-2">
                    <CardContent className="pt-6">
                        {isEditing ? (
                            <div className="space-y-4">
                                <Input
                                    placeholder="Note title (optional)"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="text-lg font-medium"
                                />
                                <Textarea
                                    placeholder="Write your note here..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="min-h-[300px] resize-none"
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>
                                        <X className="mr-2 h-4 w-4" />
                                        Cancel
                                    </Button>
                                    {selectedNote && (
                                        <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </Button>
                                    )}
                                    <Button onClick={handleSave} disabled={isSaving}>
                                        {isSaving ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="mr-2 h-4 w-4" />
                                        )}
                                        Save
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-16 text-muted-foreground">
                                <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-medium mb-2">Select a note or create new</h3>
                                <p className="text-sm mb-4">Your quick notes and thoughts go here</p>
                                <Button onClick={handleNewNote}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create New Note
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
