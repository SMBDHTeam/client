import { SpontaneousDraftProvider } from "@/store/spontaneous-draft";

export default function SpontaneousLayout({ children }: { children: React.ReactNode }) {
  return (
    <SpontaneousDraftProvider>
      <div className="relative flex flex-1 flex-col">
        {children}
      </div>
    </SpontaneousDraftProvider>
  );
}
