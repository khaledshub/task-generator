"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { PropsWithChildren } from "react";

interface AnimatedSectionProps extends PropsWithChildren {
  delay?: number;
  y?: number;
}

export function AnimatedSection({
  children,
  delay = 0,
  y = 14,
}: AnimatedSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut", delay }}
      style={{ width: "100%" }}
    >
      {children}
    </motion.div>
  );
}
