import AppShell from "@/components/layout/AppShell";
import { TripDraftProvider } from "@/store/trip-draft";

export default function AppTabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TripDraftProvider>
      <AppShell>{children}</AppShell>
    </TripDraftProvider>
  );
}
