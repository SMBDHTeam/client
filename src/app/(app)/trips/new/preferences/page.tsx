import { redirect } from "next/navigation";

export default function LegacyTripPreferencesPage() {
  redirect("/trips/new/step1");
}
