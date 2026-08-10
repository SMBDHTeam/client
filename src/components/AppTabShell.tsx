import BottomNav from "./BottomNav";

export default function AppTabShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-lg flex-col bg-white text-zinc-900 shadow-[0_0_60px_-15px_rgba(15,23,42,0.25)]">
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
