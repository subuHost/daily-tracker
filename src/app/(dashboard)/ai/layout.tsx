export default function AiLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] overflow-hidden">
            {children}
        </div>
    );
}
