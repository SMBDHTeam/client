"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const IntroScene2 = dynamic(() => import("@/components/map/IntroScene2"), {
  ssr: false,
});

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ width: "100%", height: "100dvh" }}>
      <IntroScene2 onEnter={() => router.push("/home")} />
    </div>
  );
}
