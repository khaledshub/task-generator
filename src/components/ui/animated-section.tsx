"use client";

import type { PropsWithChildren } from "react";
import { MotionReveal } from "@/components/ui/motion-reveal";

interface AnimatedSectionProps extends PropsWithChildren {
  delay?: number;
  y?: number;
}

export function AnimatedSection({
  children,
  delay = 0,
  y = 14,
}: AnimatedSectionProps) {
  return <MotionReveal delay={delay} y={y}>{children}</MotionReveal>;
}
