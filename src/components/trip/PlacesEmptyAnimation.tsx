"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const ANIMATION_CYCLE_MS = 3420;

export default function PlacesEmptyAnimation() {
  const reduceMotion = useReducedMotion();
  const [cycle, setCycle] = useState(0);
  const animateIntro = !reduceMotion;

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setCycle((current) => current + 1), ANIMATION_CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <svg
      key={cycle}
      viewBox="0 0 360 230"
      className="mx-auto h-auto w-full max-w-[22rem]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="map-left" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c8f2e9" />
          <stop offset="1" stopColor="#8edfd2" />
        </linearGradient>
        <linearGradient id="map-middle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f7fbff" />
          <stop offset="1" stopColor="#dceeff" />
        </linearGradient>
        <linearGradient id="map-right" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b9ecf1" />
          <stop offset="1" stopColor="#7fc9ef" />
        </linearGradient>
        <linearGradient id="pin-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2e7df2" />
          <stop offset="1" stopColor="#125ed4" />
        </linearGradient>
        <filter id="map-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#497daf" floodOpacity="0.16" />
        </filter>
      </defs>

      <motion.g
        style={{ transformOrigin: "180px 155px" }}
        initial={animateIntro ? { opacity: 0, scaleX: 0.18 } : false}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: animateIntro ? 0.35 : 0, ease: [0.2, 0.8, 0.2, 1] }}
        filter="url(#map-shadow)"
      >
        <path d="M38 126 109 96l72 30 72-30 69 28-17 78-65-27-61 25-67-25-83 27Z" fill="#dfefff" opacity=".55" />
        <path d="m42 116 68-29 70 29v77l-68-27-83 27Z" fill="url(#map-left)" stroke="#fff" strokeWidth="7" strokeLinejoin="round" />
        <path d="m110 87 70 29 72-29v79l-72 27v-77Z" fill="url(#map-middle)" stroke="#fff" strokeWidth="7" strokeLinejoin="round" />
        <path d="m252 87 67 28 13 78-80-27Z" fill="url(#map-right)" stroke="#fff" strokeWidth="7" strokeLinejoin="round" />
        <path d="m110 87 2 79M180 116v77M252 87v79" stroke="#fff" strokeWidth="4" opacity=".95" />
        <path d="m49 140 62-24 69 26 72-28 67 27" fill="none" stroke="#fff" strokeWidth="3" opacity=".8" />
        <path d="m60 170 53-20 66 24 74-24 65 20" fill="none" stroke="#fff" strokeWidth="3" opacity=".65" />
        <path d="M264 123h34M270 133h26M278 143h20" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".55" />
      </motion.g>

      <motion.circle
        cx="180"
        cy="117"
        r="16"
        fill="none"
        stroke="#18b8ae"
        strokeWidth="4"
        initial={animateIntro ? { opacity: 0, scale: 0.45 } : false}
        animate={{ opacity: animateIntro ? [0, 0.35, 0] : 0.18, scale: animateIntro ? [0.45, 1.25, 1.4] : 1 }}
        transition={{ duration: animateIntro ? 0.45 : 0, delay: animateIntro ? 0.5 : 0, ease: "easeOut" }}
        style={{ transformOrigin: "180px 117px" }}
      />

      <motion.g
        initial={animateIntro ? { opacity: 0, y: -40 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={
          animateIntro
            ? { delay: 0.35, duration: 0.38, type: "spring", stiffness: 260, damping: 15 }
            : { duration: 0 }
        }
      >
        <path d="M180 31c-22 0-38 16-38 37 0 27 38 61 38 61s38-34 38-61c0-21-16-37-38-37Z" fill="url(#pin-fill)" stroke="#155dcb" strokeWidth="2" />
        <circle cx="180" cy="67" r="13" fill="#fff" />
      </motion.g>

      <motion.path
        d="M71 156c32 5 47-32 78-23 29 8 35 28 70 15 29-11 45-29 77-21"
        fill="none"
        stroke="#2e7df2"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="8 10"
        initial={animateIntro ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: animateIntro ? 0.5 : 0, delay: animateIntro ? 0.7 : 0, ease: "easeInOut" }}
      />

      {[{ cx: 70, cy: 156 }, { cx: 297, cy: 127 }].map((point, index) => (
        <motion.g
          key={point.cx}
          initial={animateIntro ? { opacity: 0, scale: 0 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: animateIntro ? 0.18 : 0, delay: animateIntro ? 1.05 + index * 0.1 : 0 }}
          style={{ transformOrigin: `${point.cx}px ${point.cy}px` }}
        >
          <circle cx={point.cx} cy={point.cy} r="10" fill="#fff" />
          <circle cx={point.cx} cy={point.cy} r="6" fill={index === 0 ? "#18b8ae" : "#2e7df2"} />
        </motion.g>
      ))}

      <motion.g
        initial={animateIntro ? { opacity: 0, scale: 0.4 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: animateIntro ? 0.22 : 0, delay: animateIntro ? 1.2 : 0 }}
        style={{ transformOrigin: "250px 43px" }}
      >
        <path d="M250 30c1 8 5 12 13 13-8 1-12 5-13 13-1-8-5-12-13-13 8-1 12-5 13-13Z" fill="#18b8ae" />
        <path d="M273 28v8M269 32h8" stroke="#2e7df2" strokeWidth="2.5" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}
