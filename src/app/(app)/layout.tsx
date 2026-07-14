import BottomNav from "@/components/BottomNav";

export default function AppTabLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-dvh flex-col text-zinc-900">
            <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}