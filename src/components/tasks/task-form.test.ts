import { describe, expect, it } from "vitest";
import { toTaskFormPolledAiState } from "./task-form";
import { toPolledAiState } from "./ai-status";

describe("toTaskFormPolledAiState", () => {
  it("maps READY to a success message", () => {
    expect(toTaskFormPolledAiState("READY")).toEqual({
      aiStatus: "success",
      aiMessage: "AI tips are ready and available on the task details page.",
    });
  });

  it("maps FAILED to an error message", () => {
    expect(toTaskFormPolledAiState("FAILED")).toEqual({
      aiStatus: "error",
      aiMessage:
        "Task updated, but AI generation failed. You can still open the task and continue without AI tips.",
    });
  });

  it("clears AI messaging when generation is skipped", () => {
    expect(toTaskFormPolledAiState("SKIPPED")).toEqual({
      aiStatus: undefined,
      aiMessage: undefined,
    });
  });
});

describe("toPolledAiState", () => {
  it("uses create-specific failure messaging", () => {
    expect(toPolledAiState("FAILED", "create")).toEqual({
      aiStatus: "error",
      aiMessage:
        "Task created, but AI generation failed. You can still open the task and continue without AI tips.",
    });
  });

  it("preserves in-progress messaging for create polling", () => {
    expect(
      toPolledAiState("PENDING", "create", {
        aiStatus: "info",
        aiMessage: "AI generation is still in progress (LOCAL).",
      }),
    ).toEqual({
      aiStatus: "info",
      aiMessage: "AI generation is still in progress (LOCAL).",
    });
  });
});
