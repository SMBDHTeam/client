import { redirect } from "next/navigation";

export default function LegacyTripLocationsPage() {
  redirect("/trips/new/date");
}
