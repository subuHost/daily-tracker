"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Plus,
    Search,
    Phone,
    Mail,
    Cake,
    Users,
    Loader2,
    Building2,
} from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import { getContacts, type Contact as DBContact } from "@/lib/db";

interface Contact {
    id: string;
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

    // Fetch contacts on mount
    useEffect(() => {
        async function loadContacts() {
            try {
                const dbContacts = await getContacts();
                const formattedContacts = dbContacts.map((c) => ({
                    id: c.id,
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

    const filteredContacts = contacts.filter((contact) =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone?.includes(searchQuery) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group contacts by first letter
    const groupedContacts = filteredContacts.reduce((acc, contact) => {
        const letter = contact.name[0].toUpperCase();
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
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/contacts/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Contact
                    </Link>
                </Button>
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
                            <h2 className="text-sm font-semibold text-muted-foreground mb-2 sticky top-0 bg-background py-1">
                                {letter}
                            </h2>
                            <div className="space-y-2">
                                {groupedContacts[letter].map((contact) => (
                                    <Card key={contact.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
                                        <CardContent className="p-3 sm:p-4">
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                                                    <AvatarFallback className="bg-primary text-primary-foreground text-sm sm:text-base">
                                                        {getInitials(contact.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col">
                                                        <p className="font-medium text-sm sm:text-base">{contact.name}</p>
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
                                                        {contact.email && (
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="h-3 w-3" />
                                                                <span className="truncate">{contact.email}</span>
                                                            </span>
                                                        )}
                                                        {contact.birthday && (
                                                            <span className="flex items-center gap-1">
                                                                <Cake className="h-3 w-3 text-pink-500" />
                                                                {formatDate(contact.birthday)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
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
                        Keep track of important contacts and their birthdays.
                    </p>
                    <Button asChild>
                        <Link href="/contacts/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Your First Contact
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
