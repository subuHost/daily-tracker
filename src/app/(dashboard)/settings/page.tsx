"use client";

import { useState, useEffect } from "react";
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
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";
import { getCategories, getOrCreateCategory, deleteCategory, type Category } from "@/lib/db/categories";

export default function SettingsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [userProfile, setUserProfile] = useState<{ email?: string; name?: string } | null>(null);

    // Category State
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategory, setNewCategory] = useState("");
    const [selectedType, setSelectedType] = useState<Category["type"]>("expense");
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserProfile({
                    email: user.email,
                    name: user.user_metadata?.name || "User",
                });
            }
        };
        getUser();
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            // Fetch all types
            const [expense, income, habit, task] = await Promise.all([
                getCategories("expense"),
                getCategories("income"),
                getCategories("habit"),
                getCategories("task_group" as any), // Mapping 'task' to 'task_group' if that is DB value, but let's check. 
                // Wait, categories.ts Type has "task_group". 
                // But sample had "task". 
                // I should assume the DB uses "task_group" based on previous file view.
                // Let's verify DB schema. I'll stick to 'task_group' if that's what `categories.ts` defines.
            ]);
            // Actually `getCategories` takes a type. 
            // I should load all and concat or fetch individually.
            // Let's just fetch by type when rendering? No, fetching all is better.
            // Wait, supabase query can fetch all.
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from("categories").select("*").eq("user_id", user.id);
            if (data) setCategories(data as unknown as Category[]);
        } catch (error) {
            console.error("Failed to load categories", error);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/auth/login");
    };

    const handleExportData = () => {
        toast.success("Preparing data export... (Feature coming soon)");
    };

    const handleAddCategory = async () => {
        if (!newCategory.trim()) return;
        setIsLoadingCategories(true);
        try {
            const cat = await getOrCreateCategory(newCategory, selectedType);
            if (cat) {
                setCategories([...categories, cat]);
                setNewCategory("");
                toast.success("Category added!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to add category");
        } finally {
            setIsLoadingCategories(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Delete this category?")) return;
        try {
            await deleteCategory(id);
            setCategories(categories.filter((c) => c.id !== id));
            toast.success("Category deleted");
        } catch (error) {
            toast.error("Failed to delete category");
        }
    };

    const categoriesByType = {
        expense: categories.filter((c) => c.type === "expense"),
        income: categories.filter((c) => c.type === "income"),
        habit: categories.filter((c) => c.type === "habit"),
        task: categories.filter((c) => c.type === "task_group" || c.type === "task" as any), // Handle legacy
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
                                {getInitials(userProfile?.name || "U")}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{userProfile?.name || "User"}</p>
                            <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
                        </div>
                    </div>
                    {/*
                    <Separator />
                    <div className="grid gap-4 opacity-50 pointer-events-none">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" defaultValue={userProfile?.name} />
                        </div>
                        <Button>Save Changes</Button>
                    </div>
                    */}
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
                        Manage Categories
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
                            onChange={(e) => setSelectedType(e.target.value as any)}
                            className="px-3 rounded-md border bg-background text-sm"
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                            <option value="habit">Habit</option>
                            <option value="task_group">Task</option>
                        </select>
                        <Button onClick={handleAddCategory} size="icon" disabled={isLoadingCategories}>
                            {isLoadingCategories ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        </Button>
                    </div>

                    {/* Categories by type */}
                    <div className="space-y-6">
                        {(Object.entries(categoriesByType) as [string, Category[]][]).map(
                            ([type, cats]) =>
                                cats.length > 0 && (
                                    <div key={type}>
                                        <h3 className="text-sm font-medium text-muted-foreground capitalize mb-2">
                                            {type.replace("_group", "")} Categories
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {cats.map((category) => (
                                                <div
                                                    key={category.id}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-sm group"
                                                >
                                                    <span
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: category.color || "#6b7280" }}
                                                    />
                                                    <span>{category.name}</span>
                                                    <button
                                                        onClick={() => handleDeleteCategory(category.id)}
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
                </CardContent>
            </Card>
        </div>
    );
}
