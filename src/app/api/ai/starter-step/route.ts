import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth/options";
import { generateStarterStep } from "@/lib/ai/starter-step";
import { logger } from "@/lib/logger";
import {
  DEFAULT_TASK_TIPS,
  getDefaultTaskAiProvider,
  TASK_MAX_TIPS,
} from "@/lib/tasks/config";
import { toStringArray } from "@/lib/tasks/types";
import { starterStepRequestSchema } from "@/lib/validation/ai";

const AI_GENERATION_IN_PROGRESS_MARKER = "__PENDING_AI_GENERATION__";
const AI_ROUTE_RESULT_READY = "ready";
const AI_ROUTE_RESULT_IN_PROGRESS = "in_progress";
const AI_ROUTE_RESULT_ERROR = "error";

/**
 * Generates one AI starter step per saved task (strict per-task limit).
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        result: AI_ROUTE_RESULT_ERROR,
        error: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = starterStepRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        result: AI_ROUTE_RESULT_ERROR,
        error: parsed.error.issues[0]?.message ?? "Invalid request.",
      },
      { status: 400 },
    );
  }

  const { taskId, title, description, starterStepPrompt, aiProvider, localModel } = parsed.data;
  const resolvedAiProvider = aiProvider ?? getDefaultTaskAiProvider();

  try {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: session.user.id,
      },
      select: {
        id: true,
        tips: true,
        starterStep: true,
        checklistItems: true,
        aiStepsGenerationStatus: true,
        aiProvider: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        {
          result: AI_ROUTE_RESULT_ERROR,
          error: "Task not found.",
        },
        { status: 404 },
      );
    }

    if (task.aiStepsGenerationStatus === "READY") {
      const existingChecklistItems = toStringArray(task.checklistItems);
      const existingTips = toStringArray(task.tips);

      return NextResponse.json({
        result: AI_ROUTE_RESULT_READY,
        aiStepsGenerationStatus: "READY",
        starterStep: task.starterStep,
        todoSteps: existingChecklistItems,
        checklistItems: existingChecklistItems,
        tips: existingTips,
        reusedExistingResult: true,
      });
    }

    const claimedGeneration = await claimAiGeneration({
      userId: session.user.id,
      taskId,
      title,
    });

    if (!claimedGeneration) {
      return NextResponse.json(
        {
          result: AI_ROUTE_RESULT_IN_PROGRESS,
          aiStepsGenerationStatus: "PENDING",
          message: "AI generation is already in progress for this task.",
        },
        { status: 202 },
      );
    }

    await prisma.task.update({
      where: { id: task.id },
      data: {
        aiStepsGenerationStatus: "PENDING",
        aiProvider: resolvedAiProvider,
      },
    });

    const generated = await generateStarterStep({
      provider: resolvedAiProvider,
      title,
      description,
      starterStepPrompt,
      localModel,
    });
    const generatedTodoSteps =
      generated.todoSteps.length > 0
        ? generated.todoSteps
        : [generated.starterStep];
    const generatedTips = generated.tips.length > 0 ? generated.tips : [];
    const existingTips = toStringArray(task.tips);
    const existingTipsWithoutDefaults =
      generatedTips.length > 0
        ? existingTips.filter((tip) => !isDefaultTip(tip))
        : existingTips;
    const mergedTips = Array.from(
      new Set([...generatedTips, ...existingTipsWithoutDefaults]),
    ).slice(0, TASK_MAX_TIPS);

    await prisma.$transaction([
      prisma.task.update({
        where: {
          id: task.id,
        },
        data: {
          generateAiStepsEnabled: true,
          aiProvider: resolvedAiProvider,
          aiStepsGenerationStatus: "READY",
          starterStep: generated.starterStep,
          aiGeneratedSteps: generatedTodoSteps,
          checklistItems: generatedTodoSteps,
          tips: mergedTips,
          aiGeneratedAt: new Date(),
        },
      }),
      prisma.aiStarterStepRequest.upsert({
        where: {
          userId_taskId: {
            userId: session.user.id,
            taskId,
          },
        },
        create: {
          userId: session.user.id,
          taskId,
          titleSnapshot: title,
          generatedStep: generated.starterStep,
          promptTokens: generated.usage?.inputTokens,
          completionTokens: generated.usage?.outputTokens,
        },
        update: {
          titleSnapshot: title,
          generatedStep: generated.starterStep,
          promptTokens: generated.usage?.inputTokens,
          completionTokens: generated.usage?.outputTokens,
        },
      }),
    ]);

    revalidatePath("/app");
    revalidatePath("/app/tasks");
    revalidatePath(`/app/tasks/${taskId}`);

    return NextResponse.json({
      result: AI_ROUTE_RESULT_READY,
      aiStepsGenerationStatus: "READY",
      starterStep: generated.starterStep,
      todoSteps: generatedTodoSteps,
      checklistItems: generatedTodoSteps,
      tips: mergedTips,
      usage: generated.usage,
    });
  } catch (error) {
    try {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          aiStepsGenerationStatus: "FAILED",
          aiGeneratedAt: null,
        },
      });
      await prisma.aiStarterStepRequest.deleteMany({
        where: {
          userId: session.user.id,
          taskId,
          generatedStep: AI_GENERATION_IN_PROGRESS_MARKER,
        },
      });
    } catch (updateError) {
      logger.warn(
        { error: updateError, taskId, userId: session.user.id },
        "Failed to mark task AI status as FAILED",
      );
    }

    logger.error({ error, userId: session.user.id }, "AI starter step generation failed");

    return NextResponse.json(
      {
        result: AI_ROUTE_RESULT_ERROR,
        aiStepsGenerationStatus: "FAILED",
        error:
          error instanceof Error
            ? error.message
            : "Could not generate starter step.",
      },
      { status: 500 },
    );
  }
}

function isDefaultTip(tip: string): boolean {
  const normalizedTip = tip.trim().toLowerCase();
  return DEFAULT_TASK_TIPS.some(
    (defaultTip) => defaultTip.trim().toLowerCase() === normalizedTip,
  );
}

async function claimAiGeneration({
  userId,
  taskId,
  title,
}: {
  userId: string;
  taskId: string;
  title: string;
}): Promise<boolean> {
  const updatedExistingClaim = await prisma.aiStarterStepRequest.updateMany({
    where: {
      userId,
      taskId,
      generatedStep: {
        not: AI_GENERATION_IN_PROGRESS_MARKER,
      },
    },
    data: {
      titleSnapshot: title,
      generatedStep: AI_GENERATION_IN_PROGRESS_MARKER,
      promptTokens: null,
      completionTokens: null,
    },
  });

  if (updatedExistingClaim.count > 0) {
    return true;
  }

  try {
    await prisma.aiStarterStepRequest.create({
      data: {
        userId,
        taskId,
        titleSnapshot: title,
        generatedStep: AI_GENERATION_IN_PROGRESS_MARKER,
      },
    });

    return true;
  } catch (error) {
    if (isUniqueAiRequestError(error)) {
      return false;
    }

    throw error;
  }
}

function isUniqueAiRequestError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}
