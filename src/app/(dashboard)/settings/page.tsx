"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
    User,
    Palette,
    Tag,
    Download,
    LogOut,
    Trash2,
    Plus,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";

interface Category {
    id: string;
    name: string;
    type: "expense" | "income" | "habit" | "task";
    color: string;
}

const sampleCategories: Category[] = [
    { id: "1", name: "Food & Dining", type: "expense", color: "#ef4444" },
    { id: "2", name: "Transport", type: "expense", color: "#f97316" },
    { id: "3", name: "Entertainment", type: "expense", color: "#eab308" },
    { id: "4", name: "Salary", type: "income", color: "#22c55e" },
    { id: "5", name: "Freelance", type: "income", color: "#10b981" },
    { id: "6", name: "Gym", type: "habit", color: "#8b5cf6" },
    { id: "7", name: "Work", type: "task", color: "#3b82f6" },
];

export default function SettingsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [categories, setCategories] = useState<Category[]>(sampleCategories);
    const [newCategory, setNewCategory] = useState("");
    const [selectedType, setSelectedType] = useState<Category["type"]>("expense");

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/auth/login");
    };

    const handleExportData = () => {
        toast.success("Preparing data export...");
    };

    const addCategory = () => {
        if (!newCategory.trim()) return;
        const category: Category = {
            id: Date.now().toString(),
            name: newCategory,
            type: selectedType,
            color: "#6b7280",
        };
        setCategories([...categories, category]);
        setNewCategory("");
        toast.success("Category added!");
    };

    const deleteCategory = (id: string) => {
        setCategories(categories.filter((c) => c.id !== id));
        toast.success("Category deleted");
    };

    const categoriesByType = {
        expense: categories.filter((c) => c.type === "expense"),
        income: categories.filter((c) => c.type === "income"),
        habit: categories.filter((c) => c.type === "habit"),
        task: categories.filter((c) => c.type === "task"),
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>

            {/* Profile */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                                {getInitials("Subodh")}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">Subodh</p>
                            <p className="text-sm text-muted-foreground">subodh@example.com</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" defaultValue="Subodh" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue="subodh@example.com" />
                        </div>
                        <Button>Save Changes</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Appearance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Theme</p>
                            <p className="text-sm text-muted-foreground">
                                Toggle between light and dark mode
                            </p>
                        </div>
                        <ThemeToggle />
                    </div>
                </CardContent>
            </Card>

            {/* Categories */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Categories
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Add new category */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="New category name"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="flex-1"
                        />
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value as Category["type"])}
                            className="px-3 rounded-md border bg-background"
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                            <option value="habit">Habit</option>
                            <option value="task">Task</option>
                        </select>
                        <Button onClick={addCategory} size="icon">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Categories by type */}
                    {(Object.entries(categoriesByType) as [Category["type"], Category[]][]).map(
                        ([type, cats]) =>
                            cats.length > 0 && (
                                <div key={type}>
                                    <h3 className="text-sm font-medium text-muted-foreground capitalize mb-2">
                                        {type} Categories
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {cats.map((category) => (
                                            <div
                                                key={category.id}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-sm group"
                                            >
                                                <span
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: category.color }}
                                                />
                                                <span>{category.name}</span>
                                                <button
                                                    onClick={() => deleteCategory(category.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                    )}
                </CardContent>
            </Card>

            {/* Data */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Data
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Export All Data</p>
                            <p className="text-sm text-muted-foreground">
                                Download your data as JSON/CSV
                            </p>
                        </div>
                        <Button variant="outline" onClick={handleExportData}>
                            Export
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="text-lg text-destructive flex items-center gap-2">
                        <Trash2 className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Log Out</p>
                            <p className="text-sm text-muted-foreground">
                                Sign out of your account
                            </p>
                        </div>
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Log Out
                        </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-destructive">Delete Account</p>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete your account and data
                            </p>
                        </div>
                        <Button variant="destructive">Delete Account</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
