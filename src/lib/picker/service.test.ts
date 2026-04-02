import { afterEach, describe, expect, it, vi } from "vitest";

const dailyIntentCreateMock = vi.fn();
const pickEventFindManyMock = vi.fn();
const pickEventCreateMock = vi.fn();
const taskFindManyMock = vi.fn();
const loggerInfoMock = vi.fn();
const selectTaskForIntentMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  default: {
    dailyIntent: {
      create: dailyIntentCreateMock,
    },
    pickEvent: {
      findMany: pickEventFindManyMock,
      create: pickEventCreateMock,
    },
    task: {
      findMany: taskFindManyMock,
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: loggerInfoMock,
    warn: vi.fn(),
  },
}));

vi.mock("@/lib/picker/algorithm", () => ({
  selectTaskForIntent: selectTaskForIntentMock,
}));

describe("picker service", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("excludes tasks whose latest status event is DONE from picker candidates", async () => {
    dailyIntentCreateMock.mockResolvedValue({ id: "intent-1" });
    taskFindManyMock.mockResolvedValue([
      {
        id: "done-task",
        title: "Already done",
        description: null,
        context: "HOME",
        energy: "LOW",
        timeEstimateMinutes: 15,
        avoiding: false,
        starterStep: "Skip this",
        checklistItems: [],
        tips: [],
        aiGeneratedSteps: [],
        pickEvents: [{ action: "DONE" }],
      },
      {
        id: "open-task",
        title: "Still open",
        description: null,
        context: "HOME",
        energy: "LOW",
        timeEstimateMinutes: 15,
        avoiding: false,
        starterStep: "Start here",
        checklistItems: [],
        tips: [],
        aiGeneratedSteps: [],
        pickEvents: [{ action: "PICKED" }],
      },
    ]);
    pickEventFindManyMock.mockResolvedValue([]);
    selectTaskForIntentMock.mockReturnValue({
      status: "picked",
      task: {
        id: "open-task",
        title: "Still open",
        context: "HOME",
        energy: "LOW",
        timeEstimateMinutes: 15,
        avoiding: false,
        starterStep: "Start here",
        checklistItems: [],
        tips: [],
      },
      why: "Matches Home + 15min + Normal.",
    });
    pickEventCreateMock.mockResolvedValue({ id: "pick-1" });

    const { createIntentAndPickTask } = await import("./service");
    await createIntentAndPickTask("user-1", {
      contextChoice: "HOME",
      modeChoice: "NORMAL",
      timeAvailableMinutes: 15,
    });

    expect(selectTaskForIntentMock).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          id: "open-task",
        }),
      ],
      expect.any(Object),
      expect.any(Object),
    );
  });
});
