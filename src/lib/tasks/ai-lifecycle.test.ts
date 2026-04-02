import { describe, expect, it } from "vitest";
import {
  getAiPendingStaleMessage,
  isAiPendingStale,
  STALE_AI_PENDING_THRESHOLD_MS,
} from "@/lib/tasks/ai-lifecycle";

describe("AI lifecycle stale pending helpers", () => {
  it("marks pending as stale after the configured threshold", () => {
    const now = new Date("2026-03-15T12:00:00.000Z");
    const updatedAt = new Date(now.getTime() - STALE_AI_PENDING_THRESHOLD_MS);

    expect(isAiPendingStale("PENDING", updatedAt, now)).toBe(true);
  });

  it("does not mark recent pending tasks as stale", () => {
    const now = new Date("2026-03-15T12:00:00.000Z");
    const updatedAt = new Date(now.getTime() - STALE_AI_PENDING_THRESHOLD_MS + 1);

    expect(isAiPendingStale("PENDING", updatedAt, now)).toBe(false);
  });

  it("never marks terminal statuses as stale", () => {
    const now = new Date("2026-03-15T12:00:00.000Z");
    const updatedAt = new Date(now.getTime() - STALE_AI_PENDING_THRESHOLD_MS * 5);

    expect(isAiPendingStale("READY", updatedAt, now)).toBe(false);
    expect(isAiPendingStale("FAILED", updatedAt, now)).toBe(false);
    expect(isAiPendingStale("SKIPPED", updatedAt, now)).toBe(false);
  });

  it("returns the stale pending user-facing message", () => {
    expect(getAiPendingStaleMessage()).toBe(
      "AI checklist generation appears stuck. You can continue with the task now and retry AI generation later.",
    );
  });
});
