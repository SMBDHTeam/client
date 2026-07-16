import { redirect } from "next/navigation";

export default function LegacyTripBasicsPage() {
  redirect("/trips/new/date");
}
