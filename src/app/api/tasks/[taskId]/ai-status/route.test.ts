import { afterEach, describe, expect, it, vi } from "vitest";

const getServerSessionMock = vi.fn();

const prismaMock = {
  task: {
    findFirst: vi.fn(),
  },
};

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

vi.mock("@/lib/auth/options", () => ({
  authOptions: {},
}));

describe("task ai-status route", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns non-stale pending when the task was updated recently", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.task.findFirst.mockResolvedValue({
      aiStepsGenerationStatus: "PENDING",
      updatedAt: new Date(),
    });

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/tasks/task-1/ai-status"), {
      params: Promise.resolve({ taskId: "task-1" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      aiStepsGenerationStatus: "PENDING",
      isStalePending: false,
      message: undefined,
    });
  });

  it("returns stale pending metadata when the task has been pending too long", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.task.findFirst.mockResolvedValue({
      aiStepsGenerationStatus: "PENDING",
      updatedAt: new Date(Date.now() - 10 * 60 * 1000),
    });

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/tasks/task-1/ai-status"), {
      params: Promise.resolve({ taskId: "task-1" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      aiStepsGenerationStatus: "PENDING",
      isStalePending: true,
      message:
        "AI checklist generation appears stuck. You can continue with the task now and retry AI generation later.",
    });
  });

  it("does not mark terminal states as stale", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.task.findFirst.mockResolvedValue({
      aiStepsGenerationStatus: "READY",
      updatedAt: new Date(Date.now() - 10 * 60 * 1000),
    });

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/tasks/task-1/ai-status"), {
      params: Promise.resolve({ taskId: "task-1" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      aiStepsGenerationStatus: "READY",
      isStalePending: false,
      message: undefined,
    });
  });
});
