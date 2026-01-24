"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Plus,
    Search,
    Phone,
    Mail,
    Cake,
    Users,
    Loader2,
    Building2,
    Trash2,
    Edit2,
    UserPlus,
} from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import { getContacts, updateContact, deleteContact, type Contact as DBContact } from "@/lib/db";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Contact {
    id: string;
    firstName?: string;
    lastName?: string;
    name: string;
    company?: string;
    phone?: string;
    email?: string;
    birthday?: string;
    notes?: string;
}

export default function ContactsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // Action State
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Contact>({ id: "", name: "" });
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        if (selectedContact) {
            setEditForm({ ...selectedContact });
            setIsEditing(false);
        }
    }, [selectedContact]);

    const handleDelete = async () => {
        if (!selectedContact) return;
        if (!confirm("Are you sure you want to delete this contact?")) return;

        setIsActionLoading(true);
        try {
            await deleteContact(selectedContact.id);
            setContacts((prev) => prev.filter((c) => c.id !== selectedContact.id));
            setSelectedContact(null);
            toast.success("Contact deleted");
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete contact");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} contacts?`)) return;

        setIsActionLoading(true);
        try {
            // Sequential delete for simplicity, could be parallel
            for (const id of Array.from(selectedIds)) {
                await deleteContact(id);
            }
            setContacts(prev => prev.filter(c => !selectedIds.has(c.id)));
            setSelectedIds(new Set());
            setIsSelectionMode(false);
            toast.success("Contacts deleted");
        } catch (error) {
            toast.error("Failed to delete some contacts");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedContact) return;
        setIsActionLoading(true);
        try {
            const fullName = `${editForm.firstName || ""} ${editForm.lastName || ""}`.trim() || editForm.name;
            await updateContact(selectedContact.id, {
                first_name: editForm.firstName,
                last_name: editForm.lastName,
                company: editForm.company || null,
                name: fullName,
                phone: editForm.phone || null,
                email: editForm.email || null,
                birthday: editForm.birthday || null,
                notes: editForm.notes || null,
            });

            const updatedContact = { ...editForm, name: fullName };
            setContacts((prev) =>
                prev.map((c) => (c.id === selectedContact.id ? updatedContact : c))
            );
            setSelectedContact(updatedContact);
            setIsEditing(false);
            toast.success("Contact updated");
        } catch (error) {
            toast.error("Failed to update contact");
        } finally {
            setIsActionLoading(false);
        }
    };

    // Fetch contacts on mount
    useEffect(() => {
        async function loadContacts() {
            try {
                const dbContacts = await getContacts();
                const formattedContacts = dbContacts.map((c) => ({
                    id: c.id,
                    firstName: c.first_name || undefined,
                    lastName: c.last_name || undefined,
                    name: c.name,
                    company: c.company || undefined,
                    phone: c.phone || undefined,
                    email: c.email || undefined,
                    birthday: c.birthday || undefined,
                    notes: c.notes || undefined,
                }));
                setContacts(formattedContacts);
            } catch (error) {
                console.error("Failed to load contacts:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadContacts();
    }, []);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
        if (newSet.size > 0 && !isSelectionMode) setIsSelectionMode(true);
        if (newSet.size === 0 && isSelectionMode) setIsSelectionMode(false);
    };

    const filteredContacts = contacts.filter((contact) =>
        (contact.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (contact.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone?.includes(searchQuery) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group contacts by first letter
    const groupedContacts = filteredContacts.reduce((acc, contact) => {
        const name = contact.name || "?";
        const letter = (name[0] || "?").toUpperCase();
        if (!acc[letter]) acc[letter] = [];
        acc[letter].push(contact);
        return acc;
    }, {} as Record<string, Contact[]>);

    const sortedLetters = Object.keys(groupedContacts).sort();

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
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Contacts</h1>
                    <p className="text-muted-foreground text-sm">{contacts.length} contacts</p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                        <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedIds.size})
                        </Button>
                    )}
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/contacts/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Contact
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Contacts List */}
            {contacts.length > 0 ? (
                <div className="space-y-6">
                    {sortedLetters.map((letter) => (
                        <div key={letter}>
                            <h2 className="text-sm font-semibold text-muted-foreground mb-2 sticky top-0 bg-background py-1 flex items-center gap-2">
                                {letter}
                            </h2>
                            <div className="space-y-2">
                                {groupedContacts[letter].map((contact) => (
                                    <div key={contact.id} className="flex items-center gap-2">
                                        <Checkbox
                                            checked={selectedIds.has(contact.id)}
                                            onCheckedChange={() => toggleSelection(contact.id)}
                                        />
                                        <Card
                                            className="hover:bg-accent/50 transition-colors cursor-pointer group flex-1"
                                            onClick={() => setSelectedContact(contact)}
                                        >
                                            <CardContent className="p-3 sm:p-4">
                                                <div className="flex items-center gap-3 sm:gap-4">
                                                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-background group-hover:border-primary/20 transition-colors">
                                                        <AvatarFallback className="bg-primary text-primary-foreground text-sm sm:text-base">
                                                            {getInitials(contact.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col">
                                                            <p className="font-medium text-sm sm:text-base">
                                                                {[contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.name || "Unknown"}
                                                            </p>
                                                            {contact.company && (
                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                                    <Building2 className="h-3 w-3" />
                                                                    <span>{contact.company}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-3 mt-1 text-xs sm:text-sm text-muted-foreground">
                                                            {contact.phone && (
                                                                <span className="flex items-center gap-1">
                                                                    <Phone className="h-3 w-3" />
                                                                    <span className="truncate">{contact.phone}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredContacts.length === 0 && contacts.length > 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p>No contacts found for "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No contacts yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Add your first contact to get started.
                    </p>
                    <Button asChild>
                        <Link href="/contacts/new">Add Contact</Link>
                    </Button>
                </div>
            )}

            {/* View/Edit Dialog (Unchanged structure mostly) */}
            <Dialog open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit Contact" : "Contact Details"}</DialogTitle>
                    </DialogHeader>
                    {selectedContact && (
                        <div className="space-y-6">
                            {!isEditing && (
                                <div className="flex flex-col items-center justify-center py-4">
                                    <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
                                        <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                                            {getInitials(selectedContact.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h2 className="mt-4 text-xl font-bold text-center">
                                        {[selectedContact.firstName, selectedContact.lastName].filter(Boolean).join(" ") || selectedContact.name}
                                    </h2>
                                    {selectedContact.company && (
                                        <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                                            <Building2 className="h-4 w-4" />
                                            <span>{selectedContact.company}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>First Name</Label>
                                            <Input
                                                value={editForm.firstName || ""}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Last Name</Label>
                                            <Input
                                                value={editForm.lastName || ""}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Company</Label>
                                        <Input
                                            value={editForm.company || ""}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input
                                            value={editForm.phone || ""}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            value={editForm.email || ""}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Birthday</Label>
                                        <Input
                                            type="date"
                                            value={editForm.birthday || ""}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, birthday: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Notes</Label>
                                        <Textarea
                                            value={editForm.notes || ""}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedContact.phone && (
                                            <Button variant="outline" className="w-full gap-2" asChild>
                                                <a href={`tel:${selectedContact.phone}`}>
                                                    <Phone className="h-4 w-4 text-green-600" />
                                                    Call
                                                </a>
                                            </Button>
                                        )}
                                        {selectedContact.email && (
                                            <Button variant="outline" className="w-full gap-2" asChild>
                                                <a href={`mailto:${selectedContact.email}`}>
                                                    <Mail className="h-4 w-4 text-blue-600" />
                                                    Email
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                    {/* Info Section */}
                                    <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                                        {selectedContact.phone && (
                                            <div className="flex items-center gap-3">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{selectedContact.phone}</span>
                                            </div>
                                        )}
                                        {selectedContact.email && (
                                            <div className="flex items-center gap-3">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{selectedContact.email}</span>
                                            </div>
                                        )}
                                        {selectedContact.birthday && (
                                            <div className="flex items-center gap-3">
                                                <Cake className="h-4 w-4 text-pink-500" />
                                                <span className="text-sm">
                                                    Birthday: {formatDate(selectedContact.birthday)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-medium mb-2 text-sm text-foreground/80">Notes</h3>
                                        <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap min-h-[60px]">
                                            {selectedContact.notes || <span className="text-muted-foreground italic">No notes added.</span>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
                                {isEditing ? (
                                    <>
                                        <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isActionLoading}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleUpdate} disabled={isActionLoading}>
                                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="destructive" onClick={handleDelete} disabled={isActionLoading}>
                                            {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                            Delete
                                        </Button>
                                        <Button variant="default" onClick={() => setIsEditing(true)}>
                                            <Edit2 className="mr-2 h-4 w-4" />
                                            Edit Details
                                        </Button>
                                    </>
                                )}
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
