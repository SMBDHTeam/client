"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const IntroScene = dynamic(() => import("@/components/map/IntroScene"), {
  ssr: false,
});

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ width: "100%", height: "100dvh" }}>
      <IntroScene onEnter={() => router.push("/home")} />
    </div>
  );
}
