import { afterEach, describe, expect, it, vi } from "vitest";

const revalidatePathMock = vi.fn();
const requireSessionUserIdMock = vi.fn();
const loggerInfoMock = vi.fn();

const prismaMock = {
  task: {
    updateMany: vi.fn(),
    findFirst: vi.fn(),
  },
};

const taskFormDataToInputMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

vi.mock("@/lib/auth/session", () => ({
  requireSessionUserId: requireSessionUserIdMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: loggerInfoMock,
    warn: vi.fn(),
  },
}));

vi.mock("@/lib/validation/task", () => ({
  taskFormDataToInput: taskFormDataToInputMock,
}));

describe("task actions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("persists PENDING when update keeps AI enabled", async () => {
    requireSessionUserIdMock.mockResolvedValue("user-1");
    taskFormDataToInputMock.mockReturnValue({
      title: "Write report",
      description: "Draft it",
      frequency: "ONE_OFF",
      context: "HOME",
      type: "ADMIN",
      energy: "LOW",
      timeEstimateMinutes: 30,
      avoiding: false,
      generateAiStepsEnabled: true,
      aiProvider: "LOCAL",
      starterStep: "Write the first line",
      checklistItems: [],
      tips: [],
    });
    prismaMock.task.findFirst.mockResolvedValueOnce({
      id: "task-1",
      generateAiStepsEnabled: false,
      aiProvider: "LOCAL",
      aiStepsGenerationStatus: "SKIPPED",
    });
    prismaMock.task.updateMany.mockResolvedValue({ count: 1 });

    const { updateTaskAction } = await import("./actions");
    const result = await updateTaskAction("task-1", { statusState: "idle" }, new FormData());

    expect(prismaMock.task.updateMany).toHaveBeenCalledWith({
      where: {
        id: "task-1",
        userId: "user-1",
      },
      data: expect.objectContaining({
        generateAiStepsEnabled: true,
        aiProvider: "LOCAL",
        aiStepsGenerationStatus: "PENDING",
      }),
    });
    expect(result).toEqual({
      statusState: "success",
      message: "Task updated.",
      aiStatus: "info",
      aiMessage: "Generating AI tips with LocalGenAI...",
      aiGenerationRequest: {
        taskId: "task-1",
        title: "Write report",
        description: "Draft it",
        starterStepPrompt: "Write the first line",
        aiProvider: "LOCAL",
        localModel: undefined,
      },
    });
  });

  it("persists SKIPPED when update disables AI", async () => {
    requireSessionUserIdMock.mockResolvedValue("user-1");
    taskFormDataToInputMock.mockReturnValue({
      title: "Write report",
      description: undefined,
      frequency: "ONE_OFF",
      context: "HOME",
      type: "ADMIN",
      energy: "LOW",
      timeEstimateMinutes: 30,
      avoiding: false,
      generateAiStepsEnabled: false,
      aiProvider: "LOCAL",
      starterStep: "Write the first line",
      checklistItems: [],
      tips: [],
    });
    prismaMock.task.findFirst.mockResolvedValueOnce({
      id: "task-1",
      generateAiStepsEnabled: true,
      aiProvider: "LOCAL",
      aiStepsGenerationStatus: "READY",
    });
    prismaMock.task.updateMany.mockResolvedValue({ count: 1 });

    const { updateTaskAction } = await import("./actions");
    const result = await updateTaskAction("task-1", { statusState: "idle" }, new FormData());

    expect(prismaMock.task.updateMany).toHaveBeenCalledWith({
      where: {
        id: "task-1",
        userId: "user-1",
      },
      data: expect.objectContaining({
        generateAiStepsEnabled: false,
        aiProvider: "LOCAL",
        aiStepsGenerationStatus: "SKIPPED",
      }),
    });
    expect(result).toEqual({
      statusState: "success",
      message: "Task updated.",
      aiStatus: undefined,
      aiMessage: undefined,
      aiGenerationRequest: undefined,
    });
  });

  it("preserves READY when AI stays enabled with the same provider", async () => {
    requireSessionUserIdMock.mockResolvedValue("user-1");
    taskFormDataToInputMock.mockReturnValue({
      title: "Write report",
      description: "Updated wording",
      frequency: "ONE_OFF",
      context: "HOME",
      type: "ADMIN",
      energy: "LOW",
      timeEstimateMinutes: 30,
      avoiding: false,
      generateAiStepsEnabled: true,
      aiProvider: "LOCAL",
      starterStep: "Write the first line",
      checklistItems: [],
      tips: [],
    });
    prismaMock.task.findFirst.mockResolvedValueOnce({
      id: "task-1",
      generateAiStepsEnabled: true,
      aiProvider: "LOCAL",
      aiStepsGenerationStatus: "READY",
    });
    prismaMock.task.updateMany.mockResolvedValue({ count: 1 });

    const { updateTaskAction } = await import("./actions");
    const result = await updateTaskAction("task-1", { statusState: "idle" }, new FormData());

    expect(prismaMock.task.updateMany).toHaveBeenCalledWith({
      where: {
        id: "task-1",
        userId: "user-1",
      },
      data: expect.objectContaining({
        generateAiStepsEnabled: true,
        aiProvider: "LOCAL",
        aiStepsGenerationStatus: "READY",
      }),
    });
    expect(result).toEqual({
      statusState: "success",
      message: "Task updated.",
      aiStatus: undefined,
      aiMessage: undefined,
      aiGenerationRequest: undefined,
    });
  });

  it("re-triggers generation when the AI provider changes", async () => {
    requireSessionUserIdMock.mockResolvedValue("user-1");
    taskFormDataToInputMock.mockReturnValue({
      title: "Write report",
      description: "Draft it",
      frequency: "ONE_OFF",
      context: "HOME",
      type: "ADMIN",
      energy: "LOW",
      timeEstimateMinutes: 30,
      avoiding: false,
      generateAiStepsEnabled: true,
      aiProvider: "OPENAI",
      starterStep: "Write the first line",
      checklistItems: [],
      tips: [],
    });
    prismaMock.task.findFirst.mockResolvedValueOnce({
      id: "task-1",
      generateAiStepsEnabled: true,
      aiProvider: "LOCAL",
      aiStepsGenerationStatus: "READY",
    });
    prismaMock.task.updateMany.mockResolvedValue({ count: 1 });

    const { updateTaskAction } = await import("./actions");
    const result = await updateTaskAction("task-1", { statusState: "idle" }, new FormData());

    expect(prismaMock.task.updateMany).toHaveBeenCalledWith({
      where: {
        id: "task-1",
        userId: "user-1",
      },
      data: expect.objectContaining({
        generateAiStepsEnabled: true,
        aiProvider: "OPENAI",
        aiStepsGenerationStatus: "PENDING",
      }),
    });
    expect(result).toEqual({
      statusState: "success",
      message: "Task updated.",
      aiStatus: "info",
      aiMessage: "Generating AI tips with OpenAI...",
      aiGenerationRequest: {
        taskId: "task-1",
        title: "Write report",
        description: "Draft it",
        starterStepPrompt: "Write the first line",
        aiProvider: "OPENAI",
        localModel: undefined,
      },
    });
  });
});
