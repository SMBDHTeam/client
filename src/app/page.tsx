"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

const IntroScene2 = dynamic(() => import("@/components/map/IntroScene2"), {
  ssr: false,
});

export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/home");
    }
  }, [status, router]);

  if (status === "authenticated" || status === "loading") {
    return null;
  }

  return (
    <div style={{ width: "100%", height: "100dvh" }}>
      <IntroScene2 onEnter={() => router.push("/home")} />
    </div>
  );
}
