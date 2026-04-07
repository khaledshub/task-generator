"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "@mui/material";
import type { PropsWithChildren } from "react";

interface MotionRevealProps extends PropsWithChildren {
  delay?: number;
  y?: number;
}

export function MotionReveal({
  children,
  delay = 0,
  y,
}: MotionRevealProps) {
  const theme = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const offset = y ?? theme.app.motion.entranceOffset;

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: offset }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: theme.app.motion.duration.slow / 1000,
        ease: "easeOut",
        delay,
      }}
      style={{ width: "100%" }}
    >
      {children}
    </motion.div>
  );
}
