"use server";

import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import type { TaskFormState } from "@/lib/tasks/types";
import { LOCAL_AI_MODELS } from "@/lib/tasks/config";
import { taskFormDataToInput } from "@/lib/validation/task";

const DEFAULT_FORM_STATE: TaskFormState = { statusState: "idle" };

/**
 * Creates a task for the authenticated user.
 */
export async function createTaskAction(
  previousState: TaskFormState = DEFAULT_FORM_STATE,
  formData: FormData,
): Promise<TaskFormState> {
  void previousState;

  try {
    const userId = await requireSessionUserId();
    const input = taskFormDataToInput(formData);
    const localModel = resolveLocalModel(formData);

    const createdTask = await createTaskRecord({
      userId,
      input,
    });

    logger.info(
      { userId, taskId: createdTask.id, title: createdTask.title },
      "Task created",
    );

    revalidatePath("/app");
    revalidatePath("/app/tasks");

    return {
      statusState: "success",
      message: "Task created.",
      aiStatus: input.generateAiStepsEnabled ? "info" : undefined,
      aiMessage: input.generateAiStepsEnabled
        ? `Generating AI tips with ${toAiProviderLabel(input.aiProvider)}...`
        : undefined,
      aiGenerationRequest: input.generateAiStepsEnabled
        ? {
            taskId: createdTask.id,
            title: createdTask.title,
            description: createdTask.description ?? undefined,
            starterStepPrompt: createdTask.starterStep,
            aiProvider: input.aiProvider,
            localModel,
          }
        : undefined,
    };
  } catch (error) {
    return toTaskFormError(error);
  }
}

/**
 * Updates a task owned by the authenticated user.
 */
export async function updateTaskAction(
  taskId: string,
  previousState: TaskFormState = DEFAULT_FORM_STATE,
  formData: FormData,
): Promise<TaskFormState> {
  void previousState;

  try {
    const userId = await requireSessionUserId();
    const input = taskFormDataToInput(formData);
    const localModel = resolveLocalModel(formData);

    let updateResult;

    try {
      updateResult = await prisma.task.updateMany({
        where: {
          id: taskId,
          userId,
        },
        data: {
          ...input,
        },
      });
    } catch (error) {
      if (!isAiSchemaColumnMissingError(error)) {
        throw error;
      }

      logger.warn(
        { error, userId, taskId },
        "AI task fields unavailable in database; retrying update without AI toggle field",
      );
      const legacyInput = {
        title: input.title,
        description: input.description,
        frequency: input.frequency,
        context: input.context,
        type: input.type,
        energy: input.energy,
        timeEstimateMinutes: input.timeEstimateMinutes,
        avoiding: input.avoiding,
        starterStep: input.starterStep,
        checklistItems: input.checklistItems,
        tips: input.tips,
      };

      updateResult = await prisma.task.updateMany({
        where: {
          id: taskId,
          userId,
        },
        data: legacyInput,
      });
    }

    if (updateResult.count === 0) {
      return {
        statusState: "error",
        message: "Task not found.",
      };
    }

    const updatedTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        starterStep: true,
      },
    });

    if (!updatedTask) {
      return {
        statusState: "error",
        message: "Task not found.",
      };
    }

    revalidatePath("/app/tasks");
    revalidatePath(`/app/tasks/${taskId}`);
    revalidatePath(`/app/tasks/${taskId}/edit`);

    return {
      statusState: "success",
      message: "Task updated.",
      aiStatus: input.generateAiStepsEnabled ? "info" : undefined,
      aiMessage: input.generateAiStepsEnabled
        ? `Generating AI tips with ${toAiProviderLabel(input.aiProvider)}...`
        : undefined,
      aiGenerationRequest: input.generateAiStepsEnabled
        ? {
            taskId: updatedTask.id,
            title: updatedTask.title,
            description: updatedTask.description ?? undefined,
            starterStepPrompt: updatedTask.starterStep,
            aiProvider: input.aiProvider,
            localModel,
          }
        : undefined,
    };
  } catch (error) {
    return toTaskFormError(error);
  }
}

/**
 * Archives a task owned by the authenticated user.
 */
export async function archiveTaskAction(taskId: string): Promise<void> {
  const userId = await requireSessionUserId();

  await prisma.task.updateMany({
    where: {
      id: taskId,
      userId,
    },
    data: {
      isArchived: true,
    },
  });

  revalidatePath("/app/tasks");
}

/**
 * Maps known task action errors to user-facing form state.
 */
function toTaskFormError(error: unknown): TaskFormState {
  if (error instanceof ZodError) {
    return {
      statusState: "error",
      message: error.issues[0]?.message ?? "Invalid task input.",
    };
  }

  if (isAiSchemaColumnMissingError(error)) {
    return {
      statusState: "error",
      message:
        "Task schema is out of date. Run database migrations and try again.",
    };
  }

  return {
    statusState: "error",
    message: "Something went wrong while saving the task.",
  };
}

async function createTaskRecord({
  userId,
  input,
}: {
  userId: string;
  input: ReturnType<typeof taskFormDataToInput>;
}): Promise<{
  id: string;
  title: string;
  description: string | null;
  starterStep: string;
  generateAiStepsEnabled: boolean;
  aiProvider: "OPENAI" | "LOCAL";
}> {
  try {
    return await prisma.task.create({
      data: {
        userId,
        ...input,
        aiStepsGenerationStatus: input.generateAiStepsEnabled ? "PENDING" : "SKIPPED",
      },
      select: {
        id: true,
        title: true,
        description: true,
        starterStep: true,
        generateAiStepsEnabled: true,
        aiProvider: true,
      },
    });
  } catch (error) {
    if (!isAiSchemaColumnMissingError(error)) {
      throw error;
    }

    logger.warn(
      { error, userId },
      "AI task fields unavailable in database; creating task without AI columns",
    );

    const createdTask = await prisma.task.create({
      data: {
        userId,
        title: input.title,
        description: input.description,
        frequency: input.frequency,
        context: input.context,
        type: input.type,
        energy: input.energy,
        timeEstimateMinutes: input.timeEstimateMinutes,
        avoiding: input.avoiding,
        starterStep: input.starterStep,
        checklistItems: input.checklistItems,
        tips: input.tips,
      },
      select: {
        id: true,
        title: true,
        description: true,
        starterStep: true,
      },
    });

    return {
      ...createdTask,
      generateAiStepsEnabled: false,
      aiProvider: "LOCAL",
    };
  }
}

function isAiSchemaColumnMissingError(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2022"
  ) {
    return false;
  }

  const columnName = (error.meta?.column as string | undefined) ?? "";
  return (
    columnName.includes("generateAiStepsEnabled") ||
    columnName.includes("aiProvider") ||
    columnName.includes("aiStepsGenerationStatus") ||
    columnName.includes("aiGeneratedSteps") ||
    columnName.includes("aiGeneratedAt") ||
    columnName.includes("tips")
  );
}

function toAiProviderLabel(provider: "OPENAI" | "LOCAL"): string {
  return provider === "LOCAL" ? "LocalGenAI" : "OpenAI";
}

function resolveLocalModel(formData: FormData): (typeof LOCAL_AI_MODELS)[number] | undefined {
  const rawValue = String(formData.get("localModel") ?? "").trim();
  if (!rawValue) {
    return undefined;
  }

  return LOCAL_AI_MODELS.includes(rawValue as (typeof LOCAL_AI_MODELS)[number])
    ? (rawValue as (typeof LOCAL_AI_MODELS)[number])
    : undefined;
}
