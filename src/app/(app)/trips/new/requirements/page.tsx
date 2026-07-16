import { redirect } from "next/navigation";

export default function LegacyTripRequirementsPage() {
  redirect("/trips/new/places");
}
