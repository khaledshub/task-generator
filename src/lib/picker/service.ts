import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";
import {
  INTENT_MODE_OPTIONS,
  RECENT_DONE_LOOKBACK_DAYS,
  RECENT_PICK_LOOKBACK_COUNT,
  INTENT_TIME_OPTIONS,
} from "@/lib/picker/config";
import { selectTaskForIntent } from "@/lib/picker/algorithm";
import type {
  IntentPayload,
  PickEventActionPayload,
} from "@/lib/validation/picker";
import { toStringArray } from "@/lib/tasks/types";
import { TASK_CONTEXTS } from "@/lib/tasks/config";

interface PickTaskServiceNoMatch {
  status: "no_match";
  intentId: string;
  reason: string;
}

interface PickTaskServiceSuccess {
  status: "picked";
  intentId: string;
  pickEventId: string;
  why: string;
  task: {
    id: string;
    title: string;
    description: string | null;
    starterStep: string;
    aiGeneratedSteps: string[];
    checklistItems: string[];
    tips: string[];
  };
}

export type PickTaskServiceResult = PickTaskServiceNoMatch | PickTaskServiceSuccess;

/**
 * Persists an intent and creates a weighted-random pick event when a match exists.
 */
export async function createIntentAndPickTask(
  userId: string,
  intent: IntentPayload,
): Promise<PickTaskServiceResult> {
  const createdIntent = await prisma.dailyIntent.create({
    data: {
      userId,
      contextChoice: intent.contextChoice ?? TASK_CONTEXTS[0],
      modeChoice: intent.modeChoice ?? INTENT_MODE_OPTIONS[1],
      timeAvailableMinutes: intent.timeAvailableMinutes ?? INTENT_TIME_OPTIONS[1],
    },
  });

  const [tasks, recentPickEvents, recentDoneEvents] = await Promise.all([
    loadPickerTasks(userId),
    prisma.pickEvent.findMany({
      where: {
        userId,
        action: "PICKED",
      },
      orderBy: { pickedAt: "desc" },
      take: RECENT_PICK_LOOKBACK_COUNT,
      select: { taskId: true },
    }),
    prisma.pickEvent.findMany({
      where: {
        userId,
        action: "DONE",
        pickedAt: {
          gte: subtractDays(new Date(), RECENT_DONE_LOOKBACK_DAYS),
        },
      },
      select: { taskId: true },
    }),
  ]);

  const pickerResult = selectTaskForIntent(
    tasks.map((task) => ({
      id: task.id,
      title: task.title,
      context: task.context,
      energy: task.energy,
      timeEstimateMinutes: task.timeEstimateMinutes,
      avoiding: task.avoiding,
      starterStep: task.starterStep,
      checklistItems: toStringArray(task.checklistItems),
      tips: toStringArray(task.tips),
    })),
    intent,
    {
      recentPickedTaskIds: new Set(recentPickEvents.map((event) => event.taskId)),
      recentlyDoneTaskIds: new Set(recentDoneEvents.map((event) => event.taskId)),
    },
  );

  if (pickerResult.status === "no_match") {
    logger.info(
      { userId, intentId: createdIntent.id, reason: pickerResult.reason },
      "No matching task for intent",
    );

    return {
      status: "no_match",
      intentId: createdIntent.id,
      reason: pickerResult.reason,
    };
  }

  const selectedTask = tasks.find((task) => task.id === pickerResult.task.id);

  if (!selectedTask) {
    return {
      status: "no_match",
      intentId: createdIntent.id,
      reason: "Could not load the selected task details.",
    };
  }

  const pickEvent = await prisma.pickEvent.create({
    data: {
      userId,
      taskId: selectedTask.id,
      intentId: createdIntent.id,
      action: "PICKED",
      why: pickerResult.why,
    },
  });

  logger.info(
    {
      userId,
      taskId: selectedTask.id,
      intentId: createdIntent.id,
      pickEventId: pickEvent.id,
    },
    "Task picked for intent",
  );

  return {
    status: "picked",
    intentId: createdIntent.id,
    pickEventId: pickEvent.id,
    why: pickerResult.why,
    task: {
      id: selectedTask.id,
      title: selectedTask.title,
      description: selectedTask.description,
      starterStep: selectedTask.starterStep,
      aiGeneratedSteps: toStringArray(selectedTask.aiGeneratedSteps ?? []),
      checklistItems: toStringArray(selectedTask.checklistItems),
      tips: toStringArray(selectedTask.tips),
    },
  };
}

/**
 * Persists a STARTED, DONE, or SKIPPED event for a user-owned task.
 */
export async function createTaskStatusEvent(
  userId: string,
  payload: PickEventActionPayload,
): Promise<{ id: string }> {
  const task = await prisma.task.findFirst({
    where: {
      id: payload.taskId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!task) {
    throw new Error("Task not found.");
  }

  let intentId: string | null = null;

  if (payload.intentId) {
    const intent = await prisma.dailyIntent.findFirst({
      where: {
        id: payload.intentId,
        userId,
      },
      select: {
        id: true,
      },
    });

    intentId = intent?.id ?? null;
  }

  const createdEvent = await prisma.pickEvent.create({
    data: {
      userId,
      taskId: task.id,
      intentId,
      action: payload.action,
      skippedReason: payload.skippedReason,
      notes: payload.notes,
      why: toActionWhyLine(payload),
    },
    select: {
      id: true,
    },
  });

  logger.info(
    { userId, taskId: task.id, action: payload.action, pickEventId: createdEvent.id },
    "Task status event recorded",
  );

  return createdEvent;
}

/**
 * Builds a deterministic explanation for user-triggered status updates.
 */
function toActionWhyLine(payload: PickEventActionPayload): string {
  if (payload.action === "SKIPPED") {
    return `User skipped task (${payload.skippedReason ?? "UNKNOWN"}).`;
  }

  if (payload.action === "DONE") {
    return "User marked task as done.";
  }

  return "User marked task as started.";
}

/**
 * Returns a Date shifted backward by a fixed day count.
 */
function subtractDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

async function loadPickerTasks(userId: string): Promise<
  Array<{
    id: string;
    title: string;
    description: string | null;
    context: "HOME" | "OUT" | "COMPUTER";
    energy: "LOW" | "MEDIUM" | "HIGH";
    timeEstimateMinutes: number;
    avoiding: boolean;
    starterStep: string;
    checklistItems: Prisma.JsonValue;
    tips: Prisma.JsonValue;
    aiGeneratedSteps?: Prisma.JsonValue | null;
  }>
> {
  try {
    return await prisma.task.findMany({
      where: {
        userId,
        isArchived: false,
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        context: true,
        energy: true,
        timeEstimateMinutes: true,
        avoiding: true,
        starterStep: true,
        checklistItems: true,
        tips: true,
        aiGeneratedSteps: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2022" &&
      String(error.meta?.column ?? "").includes("aiGeneratedSteps")
    ) {
      logger.warn(
        { error, userId },
        "aiGeneratedSteps column unavailable; loading picker tasks without AI steps",
      );
      return prisma.task.findMany({
        where: {
          userId,
          isArchived: false,
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          context: true,
          energy: true,
          timeEstimateMinutes: true,
          avoiding: true,
          starterStep: true,
          checklistItems: true,
          tips: true,
        },
      });
    }

    throw error;
  }
}
