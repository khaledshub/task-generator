"use client";

import type { PropsWithChildren } from "react";
import { MotionReveal } from "@/components/ui/motion-reveal";

export function PageTransition({ children }: PropsWithChildren) {
  return <MotionReveal y={10}>{children}</MotionReveal>;
}
