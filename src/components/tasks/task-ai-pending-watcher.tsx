"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface TaskAiPendingWatcherProps {
  isPending: boolean;
  intervalMs?: number;
  maxRefreshes?: number;
}

export function TaskAiPendingWatcher({
  isPending,
  intervalMs = 1800,
  maxRefreshes = 80,
}: TaskAiPendingWatcherProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isPending) {
      return;
    }

    let refreshCount = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const refreshTaskPage = () => {
      if (stopped) {
        return;
      }

      refreshCount += 1;
      router.refresh();

      if (refreshCount >= maxRefreshes) {
        return;
      }

      timer = setTimeout(refreshTaskPage, intervalMs);
    };

    timer = setTimeout(refreshTaskPage, intervalMs);

    return () => {
      stopped = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [intervalMs, isPending, maxRefreshes, router]);

  return null;
}
