"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

export default function GeneratingOverlay() {
  const [percent, setPercent] = useState(4);
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setPercent((p) => {
        if (p >= 95) return p;
        const step = p < 55 ? 4 : p < 82 ? 2 : 0.6;
        return Math.min(95, p + step);
      });
    }, 220);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/animation/Background Full Screen-Train.json")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col overflow-hidden bg-linear-to-b from-[#0b1d38] via-[#193f63] to-[#4a7597]">
      {animationData && (
        <Lottie
          animationData={animationData}
          loop
          className="absolute inset-0 h-full w-full"
          rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center gap-2 px-6 pt-16 text-center">
        <p className="text-xs font-bold tracking-[0.35em] text-white/70">NUBI</p>
        <h2 className="text-xl font-bold text-white drop-shadow-md">여행지로 향하는 길</h2>
        <p className="text-sm text-white/70 drop-shadow-md">당신의 여정을 준비하고 있어요</p>
      </div>

      <div className="relative z-10 mt-auto px-8 pb-10">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-linear-to-r from-[#ff9d4d] to-[#ff6f61] transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2.5 text-center text-xs font-medium text-white/70 drop-shadow-md">
          코스 구성 중 · {Math.round(percent)}%
        </p>
      </div>
    </div>
  );
}
