import { TripDraftProvider } from "@/store/trip-draft";

export default function TripNewLayout({ children }: { children: React.ReactNode }) {
  return <TripDraftProvider>{children}</TripDraftProvider>;
}
