import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
    Activity,
    Wallet,
    CheckSquare,
    MessageCircle,
    Sparkles,
    Shield,
    Zap,
    Smartphone,
    ArrowRight,
    ArrowUpRight
} from "lucide-react";

export default async function HomePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If already logged in, redirect to dashboard as a convenience
    if (user) {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-primary/30 animate-fade-in overflow-x-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
                <div className="absolute top-[20%] right-[10%] w-32 h-32 bg-emerald-500/10 rounded-full blur-[80px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150 brightness-150" />
            </div>

            {/* Navbar */}
            <header className="relative z-10 border-b border-white/5 backdrop-blur-md sticky top-0">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                            <span className="text-primary-foreground font-bold text-sm">DT</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                            Daily Tracker
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/auth/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                            Login
                        </Link>
                        <Link href="/auth/login">
                            <Button className="rounded-full px-6 bg-white text-black hover:bg-white/90 font-semibold shadow-xl shadow-white/5 transition-all hover:scale-105 active:scale-95">
                                Start Tracking
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="relative z-10 pt-20 pb-20">
                <div className="container mx-auto px-6 text-center lg:text-left grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 max-w-2xl mx-auto lg:mx-0">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary animate-in slide-in-from-top-4 duration-500">
                            <Sparkles className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">AI-First Intelligence</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] animate-in fade-in slide-in-from-left-4 duration-700">
                            Master Your Life <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-emerald-400">
                                in One Unified Place.
                            </span>
                        </h1>
                        <p className="text-lg lg:text-xl text-white/50 leading-relaxed font-medium animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
                            From finance and health to habits and study goals — let our AI-powered ecosystem unify your daily tracking into a seamless, intelligent flow.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
                            <Link href="/auth/login" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full sm:w-auto rounded-full px-8 h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 scale-100 hover:scale-[1.03] active:scale-95 transition-all group">
                                    Get Started Free
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link href="#features" className="w-full sm:w-auto">
                                <Button variant="ghost" size="lg" className="w-full sm:w-auto rounded-full px-8 h-14 text-lg font-semibold hover:bg-white/5 group border border-white/5">
                                    Explore Features
                                </Button>
                            </Link>
                        </div>
                        <div className="flex items-center justify-center lg:justify-start gap-8 pt-8 text-white/40 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-white">99%</span>
                                <span className="text-xs font-medium uppercase tracking-tighter">Consistency</span>
                            </div>
                            <div className="w-[1px] h-8 bg-white/10" />
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-white">2.4k</span>
                                <span className="text-xs font-medium uppercase tracking-tighter">Daily Users</span>
                            </div>
                            <div className="w-[1px] h-8 bg-white/10" />
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-white">AI</span>
                                <span className="text-xs font-medium uppercase tracking-tighter">Briefings</span>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Preview / Visual Component */}
                    <div className="relative animate-in zoom-in-95 fade-in duration-1000 delay-500 group">
                        <div className="absolute inset-0 bg-primary/20 rounded-[2rem] blur-[50px] group-hover:bg-primary/30 transition-all duration-700" />
                        <div className="relative border border-white/10 rounded-[2rem] bg-gradient-to-br from-white/10 to-white/5 p-4 backdrop-blur-2xl shadow-2xl overflow-hidden active:scale-[0.99] transition-transform">
                            <div className="bg-[#0a0a0a] rounded-2xl overflow-hidden shadow-inner border border-white/5">
                                {/* Mimic Chat Interface */}
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                            <div className="w-3 h-3 rounded-full bg-green-500" />
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] text-primary font-bold tracking-widest uppercase">
                                            Live Intelligence
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-end">
                                            <div className="bg-primary/20 border border-primary/20 rounded-2xl p-4 text-xs font-medium text-primary shadow-lg max-w-[80%]">
                                                How's my productivity looking today?
                                            </div>
                                        </div>
                                        <div className="flex justify-start">
                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-medium text-white/70 shadow-lg max-w-[90%] space-y-2">
                                                <p>You've completed **4 tasks** already! Your focus on **System Design** is showing in your streaks. 🎯</p>
                                                <div className="flex items-center gap-2 pt-2 text-[10px] text-primary font-bold">
                                                    <ArrowUpRight className="h-3 w-3" />
                                                    View Report
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group-hover:bg-white/10 transition-colors">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-white/50 uppercase tracking-tighter">Finance</span>
                                                <span className="text-sm font-bold tracking-tight">On Track 💰</span>
                                            </div>
                                            <Wallet className="h-4 w-4 text-primary opacity-50" />
                                        </div>
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group-hover:bg-white/10 transition-colors">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-white/50 uppercase tracking-tighter">Health</span>
                                                <span className="text-sm font-bold tracking-tight">Kcal: 1,840 🍎</span>
                                            </div>
                                            <Activity className="h-4 w-4 text-emerald-500 opacity-50" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section id="features" className="relative z-10 py-32 bg-white/[0.02]">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="text-3xl lg:text-5xl font-bold">Built for the Modern High-Achiever.</h2>
                        <p className="text-white/40 max-w-xl mx-auto font-medium leading-relaxed">
                            Every module works in harmony, powered by a central intelligence layer that understands your life holistically.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Finance */}
                        <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 hover:-translate-y-2 transition-all duration-300 group">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-lg shadow-primary/10">
                                <Wallet className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Finance Intelligence</h3>
                            <p className="text-sm text-white/40 leading-relaxed font-medium">
                                Automated categorization, live budget alerts, and real-time investment tracking for crypto and stocks.
                            </p>
                        </div>

                        {/* Health */}
                        <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 hover:-translate-y-2 transition-all duration-300">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10">
                                <Activity className="h-6 w-6 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Health Insights</h3>
                            <p className="text-sm text-white/40 leading-relaxed font-medium">
                                Track calories, macronutrients, and sleep cycles. AI helps you identify correlations between mood and output.
                            </p>
                        </div>

                        {/* Tasks */}
                        <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 hover:-translate-y-2 transition-all duration-300">
                            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/10">
                                <CheckSquare className="h-6 w-6 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Smart Task Flow</h3>
                            <p className="text-sm text-white/40 leading-relaxed font-medium">
                                Focus on what matters. Spaced repetition for study and priority-aware daily planning.
                            </p>
                        </div>

                        {/* AI Assistant */}
                        <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 hover:-translate-y-2 transition-all duration-300">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-lg shadow-primary/10">
                                <MessageCircle className="h-6 w-6 text-primary animate-pulse" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Chat Intelligence</h3>
                            <p className="text-sm text-white/40 leading-relaxed font-medium">
                                A dedicated AI assistant with persistent memory, session folders, and full-screen focus.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 py-32 overflow-hidden">
                <div className="container mx-auto px-6 text-center">
                    <div className="relative p-12 lg:p-24 rounded-[3rem] bg-gradient-to-br from-primary/20 to-blue-600/10 border border-primary/20 backdrop-blur-3xl overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                        <h2 className="text-4xl lg:text-6xl font-extrabold mb-8 tracking-tight">Ready to Upgrade <br />Your Daily Life?</h2>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/auth/login">
                                <Button size="lg" className="rounded-full px-10 h-16 text-xl font-bold bg-white text-black hover:bg-white/90 shadow-2xl transition-all hover:scale-105 active:scale-95">
                                    Join for Free
                                </Button>
                            </Link>
                        </div>
                        <p className="mt-8 text-white/40 text-sm font-medium">No credit card required · Free forever for personal use</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-12 border-t border-white/5">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-[10px]">DT</span>
                        </div>
                        <span className="font-bold text-sm tracking-tight text-white/70">
                            Daily Tracker © 2026
                        </span>
                    </div>
                    <div className="flex items-center gap-8 text-sm text-white/30 font-medium">
                        <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                        <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-white transition-colors">GitHub</Link>
                        <Link href="#" className="hover:text-white transition-colors">Status</Link>
                    </div>
                    <div className="flex items-center gap-4 text-white/20">
                        <Shield className="h-5 w-5 hover:text-primary transition-colors cursor-pointer" />
                        <Zap className="h-5 w-5 hover:text-yellow-500 transition-colors cursor-pointer" />
                        <Smartphone className="h-5 w-5 hover:text-emerald-500 transition-colors cursor-pointer" />
                    </div>
                </div>
            </footer>
        </div>
    );
}
