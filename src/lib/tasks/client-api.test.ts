import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getTaskAiStatus,
  parseGetTaskAiStatusResponse,
  parseStartAiStarterStepResponse,
  startAiStarterStep,
} from "@/lib/tasks/client-api";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("client-api parsing", () => {
  it("parses starter-step response and strips invalid fields", () => {
    expect(
      parseStartAiStarterStepResponse({
        result: "ready",
        aiStepsGenerationStatus: "READY",
        message: " done ",
        error: "",
        tips: ["Tip 1", 42, "Tip 2"],
      }),
    ).toEqual({
      result: "ready",
      aiStepsGenerationStatus: "READY",
      message: "done",
      error: undefined,
      tips: ["Tip 1", "Tip 2"],
    });
  });

  it("parses task-ai-status response safely", () => {
    expect(
      parseGetTaskAiStatusResponse({
        aiStepsGenerationStatus: "FAILED",
        message: "  error ",
      }),
    ).toEqual({
      aiStepsGenerationStatus: "FAILED",
      message: "error",
      error: undefined,
    });

    expect(parseGetTaskAiStatusResponse("invalid")).toEqual({
      aiStepsGenerationStatus: undefined,
      message: undefined,
      error: undefined,
    });
  });
});

describe("client-api fetch wrappers", () => {
  it("calls starter-step endpoint and normalizes output", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ result: "in_progress", aiStepsGenerationStatus: "PENDING" }),
    } as Response);

    const result = await startAiStarterStep({
      taskId: "task-1",
      title: "Task",
      aiProvider: "LOCAL",
      localModel: "llama3.2:latest",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai/starter-step",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toEqual({
      ok: true,
      status: 200,
      data: {
        result: "in_progress",
        aiStepsGenerationStatus: "PENDING",
        message: undefined,
        error: undefined,
        tips: undefined,
      },
    });
  });

  it("calls task-ai-status endpoint with encoded id", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: "Task not found" }),
    } as Response);

    const result = await getTaskAiStatus("task/with/slash");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/tasks/task%2Fwith%2Fslash/ai-status",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(result).toEqual({
      ok: false,
      status: 404,
      data: {
        aiStepsGenerationStatus: undefined,
        message: undefined,
        error: "Task not found",
      },
    });
  });
});
