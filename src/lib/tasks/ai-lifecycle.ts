const STALE_AI_PENDING_THRESHOLD_MS = 3 * 60 * 1000;

export function isAiPendingStale(
  status: "PENDING" | "READY" | "FAILED" | "SKIPPED",
  updatedAt: Date,
  now: Date = new Date(),
): boolean {
  if (status !== "PENDING") {
    return false;
  }

  return now.getTime() - updatedAt.getTime() >= STALE_AI_PENDING_THRESHOLD_MS;
}

export function getAiPendingStaleMessage(): string {
  return "AI checklist generation appears stuck. You can continue with the task now and retry AI generation later.";
}

export { STALE_AI_PENDING_THRESHOLD_MS };
