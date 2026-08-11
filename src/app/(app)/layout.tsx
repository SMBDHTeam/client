import AppTabShell from "@/components/AppTabShell";
import { TripDraftProvider } from "@/store/trip-draft";

export default function AppTabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TripDraftProvider>
      <AppTabShell>{children}</AppTabShell>
    </TripDraftProvider>
  );
}
