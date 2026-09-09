import AppShell from "@/components/layout/AppShell";
import AppAuthGuard from "@/components/auth/AppAuthGuard";
import { TripDraftProvider } from "@/store/trip-draft";

export default function AppTabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TripDraftProvider>
      <AppAuthGuard>
        <AppShell>{children}</AppShell>
      </AppAuthGuard>
    </TripDraftProvider>
  );
}
