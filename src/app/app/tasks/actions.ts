"use server";

import { ZodError } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import type { TaskFormState } from "@/lib/tasks/types";
import { taskFormDataToInput } from "@/lib/validation/task";

const DEFAULT_FORM_STATE: TaskFormState = { status: "idle" };

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

    const createdTask = await prisma.task.create({
      data: {
        userId,
        ...input,
      },
      select: {
        id: true,
        title: true,
      },
    });

    logger.info(
      { userId, taskId: createdTask.id, title: createdTask.title },
      "Task created",
    );

    revalidatePath("/app/tasks");

    return {
      status: "success",
      message: "Task created.",
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

    const updateResult = await prisma.task.updateMany({
      where: {
        id: taskId,
        userId,
      },
      data: {
        ...input,
      },
    });

    if (updateResult.count === 0) {
      return {
        status: "error",
        message: "Task not found.",
      };
    }

    revalidatePath("/app/tasks");
    revalidatePath(`/app/tasks/${taskId}/edit`);

    return {
      status: "success",
      message: "Task updated.",
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
      status: "error",
      message: error.issues[0]?.message ?? "Invalid task input.",
    };
  }

  return {
    status: "error",
    message: "Something went wrong while saving the task.",
  };
}
