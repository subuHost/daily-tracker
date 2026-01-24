import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Header } from "@/components/layout/header";
import { SuperFab } from "@/components/layout/super-fab";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="md:pl-64">
                <Header />
                <main className="p-4 md:p-6 pb-24 md:pb-6">
                    {children}
                </main>
            </div>

            {/* Mobile Navigation */}
            <MobileNav />

            {/* Super FAB (Speed Dial) */}
            <SuperFab />
        </div>
    );
}
