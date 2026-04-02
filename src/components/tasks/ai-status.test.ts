import { describe, expect, it } from "vitest";
import {
  toAiFailureMessage,
  toAiGeneratingMessage,
  toAiInProgressMessage,
  toAiRequestKey,
  toAiSourceLabel,
  toPolledAiState,
} from "./ai-status";

const localRequest = {
  taskId: "task-1",
  title: "Write report",
  aiProvider: "LOCAL" as const,
  localModel: "llama3.2:latest" as const,
};

describe("ai-status helpers", () => {
  it("formats local provider labels consistently", () => {
    expect(toAiSourceLabel(localRequest)).toBe("LocalGenAI (llama3.2:latest)");
  });

  it("builds duplicate-trigger keys that include the local model", () => {
    expect(toAiRequestKey(localRequest)).toBe("task-1:LOCAL:llama3.2:latest");
  });

  it("returns null when no AI request exists", () => {
    expect(toAiRequestKey(undefined)).toBeNull();
  });

  it("uses the same generating message across flows", () => {
    expect(toAiGeneratingMessage(localRequest)).toBe(
      "Generating AI tips with LocalGenAI (llama3.2:latest)...",
    );
  });

  it("uses provider-aware in-progress fallback messaging", () => {
    expect(toAiInProgressMessage(localRequest)).toBe(
      "AI generation is still in progress (LocalGenAI (llama3.2:latest)).",
    );
  });

  it("uses create-specific failure messaging", () => {
    expect(toAiFailureMessage("create")).toBe(
      "Task created, but AI generation failed. You can still open the task and continue without AI tips.",
    );
  });

  it("uses edit-specific failure messaging", () => {
    expect(toAiFailureMessage("edit")).toBe(
      "Task updated, but AI generation failed. You can still open the task and continue without AI tips.",
    );
  });

  it("preserves in-progress state when polling is still pending", () => {
    expect(
      toPolledAiState("PENDING", "create", {
        aiStatus: "info",
        aiMessage: "AI generation is still in progress (LocalGenAI).",
      }),
    ).toEqual({
      aiStatus: "info",
      aiMessage: "AI generation is still in progress (LocalGenAI).",
    });
  });
});
