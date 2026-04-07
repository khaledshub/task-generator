import { describe, expect, it } from "vitest";
import {
  aiOrchestrationReducer,
  INITIAL_AI_LOCAL_STATE,
} from "@/components/tasks/use-task-ai-orchestration";

const request = {
  taskId: "task-1",
  title: "Write report",
  aiProvider: "LOCAL" as const,
  localModel: "llama3.2:latest" as const,
};

describe("aiOrchestrationReducer", () => {
  it("runs through create/edit lifecycle transitions", () => {
    const started = aiOrchestrationReducer(INITIAL_AI_LOCAL_STATE, {
      type: "start",
      runId: 1,
      taskId: "task-1",
      request,
      requestKey: "task-1:LOCAL:llama3.2:latest",
    });

    expect(started.lifecycle).toBe("ai_pending");
    expect(started.aiStatus).toBe("info");

    const pending = aiOrchestrationReducer(started, {
      type: "pending",
      runId: 1,
      message: "Still running",
    });

    expect(pending).toMatchObject({
      lifecycle: "ai_pending",
      aiStatus: "info",
      aiMessage: "Still running",
    });

    const success = aiOrchestrationReducer(pending, {
      type: "poll_terminal",
      runId: 1,
      lifecycle: "ai_success",
      aiStatus: "success",
      aiMessage: "Ready",
    });

    expect(success).toMatchObject({
      lifecycle: "ai_success",
      aiStatus: "success",
      aiMessage: "Ready",
    });
  });

  it("ignores stale responses from old runs", () => {
    const started = aiOrchestrationReducer(INITIAL_AI_LOCAL_STATE, {
      type: "start",
      runId: 2,
      taskId: "task-1",
      request,
      requestKey: "task-1:LOCAL:llama3.2:latest",
    });

    const stale = aiOrchestrationReducer(started, {
      type: "error",
      runId: 1,
      message: "Old failure",
    });

    expect(stale).toEqual(started);
  });

  it("supports direct ready state with generated tips", () => {
    const started = aiOrchestrationReducer(INITIAL_AI_LOCAL_STATE, {
      type: "start",
      runId: 3,
      taskId: "task-1",
      request,
      requestKey: "task-1:LOCAL:llama3.2:latest",
    });

    const ready = aiOrchestrationReducer(started, {
      type: "ready",
      runId: 3,
      request,
      tips: ["tip-1", "tip-2"],
    });

    expect(ready.lifecycle).toBe("ai_success");
    expect(ready.aiStatus).toBe("success");
    expect(ready.generatedTips).toEqual(["tip-1", "tip-2"]);
  });

  it("resets orchestration state", () => {
    const started = aiOrchestrationReducer(INITIAL_AI_LOCAL_STATE, {
      type: "start",
      runId: 4,
      taskId: "task-1",
      request,
      requestKey: "task-1:LOCAL:llama3.2:latest",
    });

    expect(aiOrchestrationReducer(started, { type: "reset" })).toEqual(
      INITIAL_AI_LOCAL_STATE,
    );
  });
});
