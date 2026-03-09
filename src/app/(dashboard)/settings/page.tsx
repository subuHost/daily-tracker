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
    Brain,
    Eye,
    EyeOff,
    Check,
    Key,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";
import { getCategories, getOrCreateCategory, deleteCategory, type Category } from "@/lib/db/categories";
import { getUserAiSettings, upsertUserAiSettings, type UserAiSettings } from "@/lib/db/user-settings";

export default function SettingsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [userProfile, setUserProfile] = useState<{ email?: string; name?: string } | null>(null);

    // Category State
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategory, setNewCategory] = useState("");
    const [selectedType, setSelectedType] = useState<Category["type"]>("expense");
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);

    // AI Settings State
    const [aiSettings, setAiSettings] = useState<UserAiSettings | null>(null);
    const [openaiKey, setOpenaiKey] = useState("");
    const [perplexityKey, setPerplexityKey] = useState("");
    const [claudeKey, setClaudeKey] = useState("");
    const [grokKey, setGrokKey] = useState("");
    const [preferredModel, setPreferredModel] = useState<string>("gemini-flash");
    const [showOpenaiKey, setShowOpenaiKey] = useState(false);
    const [showPerplexityKey, setShowPerplexityKey] = useState(false);
    const [showClaudeKey, setShowClaudeKey] = useState(false);
    const [showGrokKey, setShowGrokKey] = useState(false);
    const [isSavingAi, setIsSavingAi] = useState(false);
    const [isLoadingAi, setIsLoadingAi] = useState(true);

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
        loadAiSettings();
    }, []);

    const loadCategories = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from("categories").select("*").eq("user_id", user.id);
            if (data) setCategories(data as unknown as Category[]);
        } catch (error) {
            console.error("Failed to load categories", error);
        }
    };

    const loadAiSettings = async () => {
        try {
            const settings = await getUserAiSettings();
            if (settings) {
                setAiSettings(settings);
                setOpenaiKey(settings.openai_api_key || "");
                setPerplexityKey(settings.perplexity_api_key || "");
                setClaudeKey(settings.claude_api_key || "");
                setGrokKey(settings.grok_api_key || "");
                setPreferredModel(settings.preferred_model || "gemini-flash");
            }
        } catch (error) {
            console.error("Failed to load AI settings", error);
        } finally {
            setIsLoadingAi(false);
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

    const handleSaveAiSettings = async () => {
        setIsSavingAi(true);
        try {
            await upsertUserAiSettings({
                openai_api_key: openaiKey || null,
                perplexity_api_key: perplexityKey || null,
                claude_api_key: claudeKey || null,
                grok_api_key: grokKey || null,
                preferred_model: preferredModel as any,
            });
            toast.success("AI settings saved!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save AI settings");
        } finally {
            setIsSavingAi(false);
        }
    };

    const maskKey = (key: string) => {
        if (!key || key.length < 8) return key;
        return key.substring(0, 4) + "•".repeat(key.length - 8) + key.substring(key.length - 4);
    };

    const categoriesByType = {
        expense: categories.filter((c) => c.type === "expense"),
        income: categories.filter((c) => c.type === "income"),
        habit: categories.filter((c) => c.type === "habit"),
        task: categories.filter((c) => c.type === "task_group" || c.type === ("task" as any)),
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

            {/* AI API Keys */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        AI API Keys
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                        Configure your own API keys to unlock additional AI features like the Stock Research Agent.
                        Keys are stored securely and only accessible to your account.
                    </p>

                    {isLoadingAi ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            {/* Preferred Model */}
                            <div className="space-y-2">
                                <Label htmlFor="preferred-model">Preferred AI Model</Label>
                                <select
                                    id="preferred-model"
                                    value={preferredModel}
                                    onChange={(e) => setPreferredModel(e.target.value as any)}
                                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                                >
                                    <optgroup label="⚡ Fast Models">
                                        <option value="gemini-flash">Gemini Flash (Free)</option>
                                        <option value="gpt-4o-mini">GPT-4o mini</option>
                                        <option value="claude-3-haiku">Claude Haiku</option>
                                        <option value="grok-2-mini">Grok-2 mini</option>
                                    </optgroup>
                                    <optgroup label="🧠 Thinking Models">
                                        <option value="gemini-pro">Gemini Pro</option>
                                        <option value="gpt-4o">GPT-4o</option>
                                        <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                                        <option value="grok-2">Grok-2</option>
                                    </optgroup>
                                </select>
                                <p className="text-xs text-muted-foreground">
                                    Gemini Flash is used by default and doesn&apos;t require an API key.
                                </p>
                            </div>

                            <Separator />

                            {/* OpenAI Key */}
                            <div className="space-y-2">
                                <Label htmlFor="openai-key" className="flex items-center gap-2">
                                    <Key className="h-3.5 w-3.5" />
                                    OpenAI API Key
                                </Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            id="openai-key"
                                            type={showOpenaiKey ? "text" : "password"}
                                            value={openaiKey}
                                            onChange={(e) => setOpenaiKey(e.target.value)}
                                            placeholder="sk-..."
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showOpenaiKey ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Required for GPT-4o analysis in the Stock Research Agent.
                                    Get your key from{" "}
                                    <a
                                        href="https://platform.openai.com/api-keys"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        platform.openai.com
                                    </a>
                                </p>
                            </div>

                            {/* Perplexity Key */}
                            <div className="space-y-2">
                                <Label htmlFor="perplexity-key" className="flex items-center gap-2">
                                    <Key className="h-3.5 w-3.5" />
                                    Perplexity API Key
                                </Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            id="perplexity-key"
                                            type={showPerplexityKey ? "text" : "password"}
                                            value={perplexityKey}
                                            onChange={(e) => setPerplexityKey(e.target.value)}
                                            placeholder="pplx-..."
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPerplexityKey(!showPerplexityKey)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPerplexityKey ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Powers web-search-augmented research for stocks and news.
                                    Get your key from{" "}
                                    <a
                                        href="https://www.perplexity.ai/settings/api"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        perplexity.ai/settings
                                    </a>
                                </p>
                            </div>

                            {/* Claude Key */}
                            <div className="space-y-2">
                                <Label htmlFor="claude-key" className="flex items-center gap-2">
                                    <Key className="h-3.5 w-3.5" />
                                    Claude API Key
                                </Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            id="claude-key"
                                            type={showClaudeKey ? "text" : "password"}
                                            value={claudeKey}
                                            onChange={(e) => setClaudeKey(e.target.value)}
                                            placeholder="sk-ant-..."
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowClaudeKey(!showClaudeKey)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showClaudeKey ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Required for Claude models. Get your key from{" "}
                                    <a
                                        href="https://console.anthropic.com/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        console.anthropic.com
                                    </a>
                                </p>
                            </div>

                            {/* Grok Key */}
                            <div className="space-y-2">
                                <Label htmlFor="grok-key" className="flex items-center gap-2">
                                    <Key className="h-3.5 w-3.5" />
                                    Grok API Key
                                </Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            id="grok-key"
                                            type={showGrokKey ? "text" : "password"}
                                            value={grokKey}
                                            onChange={(e) => setGrokKey(e.target.value)}
                                            placeholder="xai-..."
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowGrokKey(!showGrokKey)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showGrokKey ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Required for Grok models. Get your key from{" "}
                                    <a
                                        href="https://console.x.ai/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        console.x.ai
                                    </a>
                                </p>
                            </div>

                            <Button onClick={handleSaveAiSettings} disabled={isSavingAi} className="w-full">
                                {isSavingAi ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Save AI Settings
                                    </>
                                )}
                            </Button>
                        </>
                    )}
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
