import { afterEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();
const generateStarterStepMock = vi.fn();
const revalidatePathMock = vi.fn();
const loggerErrorMock = vi.fn();
const loggerWarnMock = vi.fn();

const prismaMock = {
  task: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  aiStarterStepRequest: {
    create: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations)),
};

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

vi.mock("@/lib/auth/options", () => ({
  authOptions: {},
}));

vi.mock("@/lib/ai/starter-step", () => ({
  generateStarterStep: generateStarterStepMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: loggerErrorMock,
    warn: loggerWarnMock,
  },
}));

vi.mock("@prisma/client", () => {
  class PrismaClientKnownRequestError extends Error {
    code: string;

    constructor(message: string, options: { code: string }) {
      super(message);
      this.code = options.code;
    }
  }

  return {
    Prisma: {
      PrismaClientKnownRequestError,
    },
  };
});

describe("AI starter step route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reuses existing generated task data when AI status is READY", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.task.findFirst.mockResolvedValue({
      id: "task-1",
      starterStep: "Open the doc",
      checklistItems: ["Open the doc", "Write one line"],
      tips: ["Start now"],
      aiStepsGenerationStatus: "READY",
      aiProvider: "LOCAL",
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/ai/starter-step", {
        method: "POST",
        body: JSON.stringify({
          taskId: "task-12345",
          title: "Write report",
          aiProvider: "LOCAL",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      result: "ready",
      aiStepsGenerationStatus: "READY",
      starterStep: "Open the doc",
      todoSteps: ["Open the doc", "Write one line"],
      checklistItems: ["Open the doc", "Write one line"],
      tips: ["Start now"],
      reusedExistingResult: true,
    });
    expect(generateStarterStepMock).not.toHaveBeenCalled();
    expect(prismaMock.task.update).not.toHaveBeenCalled();
  });

  it("returns in-progress when a duplicate request hits a PENDING task", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.task.findFirst.mockResolvedValue({
      id: "task-1",
      starterStep: "Open the doc",
      checklistItems: [],
      tips: [],
      aiStepsGenerationStatus: "PENDING",
      aiProvider: "LOCAL",
    });

    const { Prisma } = await import("@prisma/client");
    prismaMock.aiStarterStepRequest.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.aiStarterStepRequest.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Duplicate", { code: "P2002" }),
    );

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/ai/starter-step", {
        method: "POST",
        body: JSON.stringify({
          taskId: "task-12345",
          title: "Write report",
          aiProvider: "LOCAL",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({
      result: "in_progress",
      aiStepsGenerationStatus: "PENDING",
      message: "AI generation is already in progress for this task.",
    });
    expect(generateStarterStepMock).not.toHaveBeenCalled();
    expect(prismaMock.task.update).not.toHaveBeenCalled();
  });

  it("persists READY data after successful generation", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.task.findFirst.mockResolvedValue({
      id: "task-1",
      starterStep: "Old step",
      checklistItems: [],
      tips: [
        "Start with the 2-minute starter step before deciding whether to continue.",
        "Keep the useful custom tip",
      ],
      aiStepsGenerationStatus: "SKIPPED",
      aiProvider: "LOCAL",
    });
    prismaMock.aiStarterStepRequest.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.aiStarterStepRequest.upsert.mockResolvedValue({});
    prismaMock.task.update.mockResolvedValue({});
    generateStarterStepMock.mockResolvedValue({
      starterStep: "Write the first sentence",
      todoSteps: ["Write the first sentence", "Draft a rough outline"],
      tips: ["Silence notifications"],
      usage: {
        inputTokens: 10,
        outputTokens: 20,
      },
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/ai/starter-step", {
        method: "POST",
        body: JSON.stringify({
          taskId: "task-12345",
          title: "Write report",
          aiProvider: "LOCAL",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      result: "ready",
      aiStepsGenerationStatus: "READY",
      starterStep: "Write the first sentence",
      todoSteps: ["Write the first sentence", "Draft a rough outline"],
      checklistItems: ["Write the first sentence", "Draft a rough outline"],
      tips: ["Silence notifications", "Keep the useful custom tip"],
      usage: {
        inputTokens: 10,
        outputTokens: 20,
      },
    });
    expect(prismaMock.task.update).toHaveBeenNthCalledWith(1, {
      where: { id: "task-1" },
      data: {
        aiStepsGenerationStatus: "PENDING",
        aiProvider: "LOCAL",
      },
    });
    expect(prismaMock.task.update).toHaveBeenNthCalledWith(2, {
      where: {
        id: "task-1",
      },
      data: {
        generateAiStepsEnabled: true,
        aiProvider: "LOCAL",
        aiStepsGenerationStatus: "READY",
        starterStep: "Write the first sentence",
        aiGeneratedSteps: ["Write the first sentence", "Draft a rough outline"],
        checklistItems: ["Write the first sentence", "Draft a rough outline"],
        tips: ["Silence notifications", "Keep the useful custom tip"],
        aiGeneratedAt: expect.any(Date),
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/app");
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/tasks");
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/tasks/task-12345");
  });

  it("returns in-progress when a retry race loses the claim for a SKIPPED task", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.task.findFirst.mockResolvedValue({
      id: "task-1",
      starterStep: "Old step",
      checklistItems: [],
      tips: [],
      aiStepsGenerationStatus: "SKIPPED",
      aiProvider: "LOCAL",
    });

    const { Prisma } = await import("@prisma/client");
    prismaMock.aiStarterStepRequest.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.aiStarterStepRequest.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Duplicate", { code: "P2002" }),
    );

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/ai/starter-step", {
        method: "POST",
        body: JSON.stringify({
          taskId: "task-12345",
          title: "Write report",
          aiProvider: "LOCAL",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({
      result: "in_progress",
      aiStepsGenerationStatus: "PENDING",
      message: "AI generation is already in progress for this task.",
    });
    expect(generateStarterStepMock).not.toHaveBeenCalled();
    expect(prismaMock.task.update).not.toHaveBeenCalled();
  });

  it("marks the task FAILED when generation throws", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.task.findFirst.mockResolvedValue({
      id: "task-1",
      starterStep: "Old step",
      checklistItems: [],
      tips: [],
      aiStepsGenerationStatus: "SKIPPED",
      aiProvider: "LOCAL",
    });
    prismaMock.aiStarterStepRequest.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.aiStarterStepRequest.upsert.mockResolvedValue({});
    prismaMock.task.update.mockResolvedValue({});
    prismaMock.aiStarterStepRequest.deleteMany.mockResolvedValue({ count: 1 });
    generateStarterStepMock.mockRejectedValue(new Error("Provider timeout"));

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/ai/starter-step", {
        method: "POST",
        body: JSON.stringify({
          taskId: "task-12345",
          title: "Write report",
          aiProvider: "LOCAL",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      result: "error",
      aiStepsGenerationStatus: "FAILED",
      error: "Provider timeout",
    });
    expect(prismaMock.task.update).toHaveBeenNthCalledWith(2, {
      where: { id: "task-12345" },
      data: {
        aiStepsGenerationStatus: "FAILED",
        aiGeneratedAt: null,
      },
    });
    expect(prismaMock.aiStarterStepRequest.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        taskId: "task-12345",
        generatedStep: "__PENDING_AI_GENERATION__",
      },
    });
    expect(loggerErrorMock).toHaveBeenCalled();
  });
});
