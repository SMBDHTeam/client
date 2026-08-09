"use client";

import { useRouter } from "next/navigation";
import { useTripDraft } from "@/store/trip-draft";

export default function NewTripStartLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { resetDraft } = useTripDraft();

  function handleClick() {
    resetDraft();
    router.push("/trips/new/date");
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
