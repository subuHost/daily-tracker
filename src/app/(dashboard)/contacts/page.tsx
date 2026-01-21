"use client";

import { useState } from "react";
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
    User,
} from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";

interface Contact {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    birthday?: string;
    notes?: string;
}

const sampleContacts: Contact[] = [
    { id: "1", name: "Mom", phone: "+91 98765 43210", birthday: "1965-05-15" },
    { id: "2", name: "Dad", phone: "+91 98765 43211", birthday: "1962-08-22" },
    { id: "3", name: "Rahul Sharma", phone: "+91 98765 12345", email: "rahul@email.com" },
    { id: "4", name: "Priya Singh", phone: "+91 87654 32109", email: "priya@email.com", birthday: "1995-03-10" },
    { id: "5", name: "Amit Kumar", email: "amit.kumar@work.com", notes: "College friend" },
    { id: "6", name: "Dr. Verma", phone: "+91 99887 76655", notes: "Family doctor" },
];

export default function ContactsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [contacts] = useState<Contact[]>(sampleContacts);

    const filteredContacts = contacts.filter((contact) =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
                    <p className="text-muted-foreground">{contacts.length} contacts</p>
                </div>
                <Button asChild>
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
            <div className="space-y-6">
                {sortedLetters.map((letter) => (
                    <div key={letter}>
                        <h2 className="text-sm font-semibold text-muted-foreground mb-2 sticky top-0 bg-background py-1">
                            {letter}
                        </h2>
                        <div className="space-y-2">
                            {groupedContacts[letter].map((contact) => (
                                <Card key={contact.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarFallback className="bg-primary text-primary-foreground">
                                                    {getInitials(contact.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium">{contact.name}</p>
                                                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                                                    {contact.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {contact.phone}
                                                        </span>
                                                    )}
                                                    {contact.email && (
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {contact.email}
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

                {filteredContacts.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No contacts found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
