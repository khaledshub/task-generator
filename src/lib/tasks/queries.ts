import { Prisma, type PickAction } from "@prisma/client";
import prisma from "@/lib/prisma";

export interface TasksPageData {
  activeTasks: Array<{
    id: string;
    title: string;
    description: string | null;
    context: "HOME" | "OUT" | "COMPUTER";
    energy: "LOW" | "MEDIUM" | "HIGH";
    type: "CHORE" | "REPAIR" | "BUSINESS" | "HEALTH" | "SOCIAL" | "ADMIN";
    frequency: "ONE_OFF" | "DAILY" | "WEEKLY" | "MONTHLY";
    timeEstimateMinutes: number;
    avoiding: boolean;
    starterStep: string;
    checklistItems: Prisma.JsonValue;
    tips: Prisma.JsonValue;
  }>;
  archivedTasks: Array<{
    id: string;
    title: string;
    updatedAt: Date;
  }>;
}

export interface TaskHistoryFilters {
  userId: string;
  fromDate: Date | null;
  toDate: Date | null;
  limit: 5 | 10 | 20;
}

export interface TaskHistoryPageData {
  tasks: Array<{
    id: string;
    createdAt: Date;
    isArchived: boolean;
    title: string;
    description: string | null;
    context: "HOME" | "OUT" | "COMPUTER";
    energy: "LOW" | "MEDIUM" | "HIGH";
    type: "CHORE" | "REPAIR" | "BUSINESS" | "HEALTH" | "SOCIAL" | "ADMIN";
    frequency: "ONE_OFF" | "DAILY" | "WEEKLY" | "MONTHLY";
    timeEstimateMinutes: number;
  }>;
  totalTasks: number;
  events: Array<{
    id: string;
    pickedAt: Date;
    action: PickAction;
    skippedReason: "TOO_HARD" | "NO_TIME" | "NOT_TODAY" | "BLOCKED" | "OTHER" | null;
    notes: string | null;
    why: string;
    task: {
      title: string;
    };
  }>;
}

export async function getTasksPageData(userId: string): Promise<TasksPageData> {
  const [activeTasks, archivedTasks] = await Promise.all([
    prisma.task.findMany({
      where: { userId, isArchived: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        context: true,
        energy: true,
        type: true,
        frequency: true,
        timeEstimateMinutes: true,
        avoiding: true,
        starterStep: true,
        checklistItems: true,
        tips: true,
      },
    }),
    prisma.task.findMany({
      where: { userId, isArchived: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    activeTasks,
    archivedTasks,
  };
}

export async function getTaskHistoryPageData(
  filters: TaskHistoryFilters,
): Promise<TaskHistoryPageData> {
  const { userId, fromDate, toDate, limit } = filters;
  const createdAtRange = {
    gte: fromDate ?? undefined,
    lte: toDate ? endOfDay(toDate) : undefined,
  };
  const pickedAtRange = {
    gte: fromDate ?? undefined,
    lte: toDate ? endOfDay(toDate) : undefined,
  };

  const [tasks, totalTasks, events] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId,
        createdAt: createdAtRange,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        isArchived: true,
        title: true,
        description: true,
        context: true,
        energy: true,
        type: true,
        frequency: true,
        timeEstimateMinutes: true,
      },
    }),
    prisma.task.count({
      where: {
        userId,
        createdAt: createdAtRange,
      },
    }),
    prisma.pickEvent.findMany({
      where: {
        userId,
        pickedAt: pickedAtRange,
      },
      include: {
        task: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        pickedAt: "desc",
      },
      take: 20,
    }),
  ]);

  return {
    tasks,
    totalTasks,
    events,
  };
}

function endOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}
