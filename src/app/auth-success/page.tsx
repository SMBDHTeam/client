"use client";

import { useEffect } from "react";

export default function AuthSuccess() {
  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage("auth-success", "*");
      window.close();
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100dvh",
        fontFamily: "sans-serif",
      }}
    >
      <p style={{ color: "#64748b" }}>로그인 완료 중...</p>
    </div>
  );
}
  