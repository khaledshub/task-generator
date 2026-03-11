import { describe, expect, it } from "vitest";
import {
  chooseWeighted,
  scoreCandidate,
  selectTaskForIntent,
} from "@/lib/picker/algorithm";
import type { FairnessInputs, IntentInput, PickerTask } from "@/lib/picker/types";

const baseIntent: IntentInput = {
  contextChoice: "HOME",
  modeChoice: "NORMAL",
  timeAvailableMinutes: 30,
};

const fairness: FairnessInputs = {
  recentPickedTaskIds: new Set<string>(),
  recentlyDoneTaskIds: new Set<string>(),
};

function createTask(partial: Partial<PickerTask> = {}): PickerTask {
  return {
    id: partial.id ?? "task-id",
    title: partial.title ?? "Task",
    context: partial.context ?? "HOME",
    energy: partial.energy ?? "LOW",
    timeEstimateMinutes: partial.timeEstimateMinutes ?? 15,
    avoiding: partial.avoiding ?? false,
    starterStep: partial.starterStep ?? "Start",
    checklistItems: partial.checklistItems ?? [],
    tips: partial.tips ?? [],
  };
}

describe("picker algorithm", () => {
  it("returns no_match when context/mode filters remove all candidates", () => {
    const result = selectTaskForIntent(
      [createTask({ context: "OUT" })],
      baseIntent,
      fairness,
    );

    expect(result.status).toBe("no_match");
  });

  it("uses fallback time window when strict time has no matches", () => {
    const result = selectTaskForIntent(
      [createTask({ timeEstimateMinutes: 40 })],
      baseIntent,
      fairness,
      { random: () => 0.1 },
    );

    expect(result.status).toBe("picked");
    if (result.status === "picked") {
      expect(result.usedTimeFallback).toBe(true);
      expect(result.task.timeEstimateMinutes).toBe(40);
    }
  });

  it("applies avoiding boost and fairness penalties to candidate weights", () => {
    const task = createTask({ id: "task-1", avoiding: true });

    const score = scoreCandidate(
      task,
      baseIntent,
      {
        recentPickedTaskIds: new Set(["task-1"]),
        recentlyDoneTaskIds: new Set(["task-1"]),
      },
      false,
    );

    expect(score.hasAvoidingBoost).toBe(true);
    expect(score.hasRecentPickPenalty).toBe(true);
    expect(score.hasRecentDonePenalty).toBe(true);
    expect(score.weight).toBeGreaterThan(0);
    expect(score.weight).toBeLessThan(1);
  });

  it("restricts chill mode to low-energy tasks", () => {
    const result = selectTaskForIntent(
      [
        createTask({ id: "low", energy: "LOW" }),
        createTask({ id: "medium", energy: "MEDIUM" }),
      ],
      {
        ...baseIntent,
        modeChoice: "CHILL",
      },
      fairness,
      { random: () => 0.9 },
    );

    expect(result.status).toBe("picked");
    if (result.status === "picked") {
      expect(result.task.id).toBe("low");
    }
  });

  it("returns no_match when fallback window is still too short", () => {
    const result = selectTaskForIntent(
      [createTask({ timeEstimateMinutes: 90 })],
      baseIntent,
      fairness,
    );

    expect(result.status).toBe("no_match");
    if (result.status === "no_match") {
      expect(result.reason).toContain("selected time");
    }
  });

  it("chooseWeighted honors weight distribution boundaries", () => {
    const candidates = [
      scoreCandidate(createTask({ id: "a" }), baseIntent, fairness, false),
      scoreCandidate(createTask({ id: "b" }), baseIntent, fairness, false),
    ];

    candidates[0].weight = 0.25;
    candidates[1].weight = 0.75;

    const first = chooseWeighted(candidates, () => 0.1);
    const second = chooseWeighted(candidates, () => 0.95);

    expect(first.task.id).toBe("a");
    expect(second.task.id).toBe("b");
  });
});
