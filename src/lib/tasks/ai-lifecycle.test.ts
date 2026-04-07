import { describe, expect, it } from "vitest";
import {
  getAiFailureMessage,
  getAiPendingDuplicateMessage,
  getAiPendingStaleMessage,
  getAiReadyMessage,
  getTaskAiStatusSnapshot,
  isAiPendingStale,
  isAiTerminalStatus,
  resolveInitialAiStatus,
  resolveUpdateAiBehavior,
  STALE_AI_PENDING_THRESHOLD_MS,
} from "@/lib/tasks/ai-lifecycle";

describe("AI lifecycle helpers", () => {
  it("returns PENDING for tasks that enable AI on create", () => {
    expect(resolveInitialAiStatus(true)).toBe("PENDING");
    expect(resolveInitialAiStatus(false)).toBe("SKIPPED");
  });

  it("re-triggers generation when AI is newly enabled", () => {
    expect(
      resolveUpdateAiBehavior(
        {
          generateAiStepsEnabled: false,
          aiProvider: "LOCAL",
          aiStepsGenerationStatus: "SKIPPED",
        },
        {
          generateAiStepsEnabled: true,
          aiProvider: "LOCAL",
        },
      ),
    ).toEqual({
      nextStatus: "PENDING",
      shouldTriggerGeneration: true,
    });
  });

  it("preserves READY when AI remains enabled with the same provider", () => {
    expect(
      resolveUpdateAiBehavior(
        {
          generateAiStepsEnabled: true,
          aiProvider: "LOCAL",
          aiStepsGenerationStatus: "READY",
        },
        {
          generateAiStepsEnabled: true,
          aiProvider: "LOCAL",
        },
      ),
    ).toEqual({
      nextStatus: "READY",
      shouldTriggerGeneration: false,
    });
  });

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

  it("returns the shared user-facing messages", () => {
    expect(getAiPendingStaleMessage()).toBe(
      "AI checklist generation appears stuck. You can continue with the task now and retry AI generation later.",
    );
    expect(getAiPendingDuplicateMessage()).toBe(
      "AI generation is already in progress for this task.",
    );
    expect(getAiReadyMessage()).toBe(
      "AI tips are ready and available on the task details page.",
    );
  });

  it("returns context-specific failure messaging", () => {
    expect(getAiFailureMessage("create")).toContain("Task created");
    expect(getAiFailureMessage("edit")).toContain("Task updated");
  });

  it("exposes a normalized task AI status snapshot", () => {
    const now = new Date("2026-03-15T12:00:00.000Z");
    const updatedAt = new Date(now.getTime() - STALE_AI_PENDING_THRESHOLD_MS);

    expect(getTaskAiStatusSnapshot("PENDING", updatedAt, now)).toEqual({
      aiStepsGenerationStatus: "PENDING",
      isPending: true,
      isTerminal: false,
      isStalePending: true,
      message:
        "AI checklist generation appears stuck. You can continue with the task now and retry AI generation later.",
    });
  });

  it("treats non-pending states as terminal", () => {
    expect(isAiTerminalStatus("READY")).toBe(true);
    expect(isAiTerminalStatus("FAILED")).toBe(true);
    expect(isAiTerminalStatus("SKIPPED")).toBe(true);
    expect(isAiTerminalStatus("PENDING")).toBe(false);
  });
});
