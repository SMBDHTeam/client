"use client";

import { motion } from "framer-motion";

export default function PageFade({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
