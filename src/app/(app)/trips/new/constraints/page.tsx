import { redirect } from "next/navigation";

export default function LegacyTripConstraintsPage() {
  redirect("/trips/new/places");
}
