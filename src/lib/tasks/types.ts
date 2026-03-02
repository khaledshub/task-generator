import type { Prisma } from "@prisma/client";
import {
  DEFAULT_TASK_TIPS,
  TASK_CONTEXTS,
  TASK_ENERGIES,
  TASK_FREQUENCIES,
  TASK_TYPES,
  type TaskContextValue,
  type TaskEnergyValue,
  type TaskFrequencyValue,
  type TaskTypeValue,
} from "@/lib/tasks/config";

export interface TaskFormState {
  statusState: "idle" | "success" | "error";
  message?: string;
}

export interface TaskFormValues {
  title: string;
  description: string;
  frequency: TaskFrequencyValue;
  context: TaskContextValue;
  type: TaskTypeValue;
  energy: TaskEnergyValue;
  timeEstimateMinutes: number;
  avoiding: boolean;
  starterStep: string;
  checklistItems: string[];
  tips: string[];
}

export const DEFAULT_TASK_FORM_VALUES: TaskFormValues = {
  title: "",
  description: "",
  frequency: TASK_FREQUENCIES[0],
  context: TASK_CONTEXTS[0],
  type: TASK_TYPES[0],
  energy: TASK_ENERGIES[1],
  timeEstimateMinutes: 30,
  avoiding: false,
  starterStep: "",
  checklistItems: [],
  tips: [...DEFAULT_TASK_TIPS],
};

/**
 * Maps a Prisma task record into editable form defaults.
 */
export function mapTaskToFormValues(task: {
  title: string;
  description: string | null;
  frequency: TaskFrequencyValue;
  context: TaskContextValue;
  type: TaskTypeValue;
  energy: TaskEnergyValue;
  timeEstimateMinutes: number;
  avoiding: boolean;
  starterStep: string;
  checklistItems: Prisma.JsonValue;
  tips: Prisma.JsonValue;
}): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? "",
    frequency: task.frequency,
    context: task.context,
    type: task.type,
    energy: task.energy,
    timeEstimateMinutes: task.timeEstimateMinutes,
    avoiding: task.avoiding,
    starterStep: task.starterStep,
    checklistItems: toStringArray(task.checklistItems),
    tips: toStringArray(task.tips),
  };
}

/**
 * Safely reads string arrays from Prisma Json values.
 */
export function toStringArray(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}
