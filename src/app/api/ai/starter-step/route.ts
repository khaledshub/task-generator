import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth/options";
import { generateStarterStep } from "@/lib/ai/starter-step";
import { logger } from "@/lib/logger";
import { DEFAULT_TASK_TIPS, TASK_MAX_TIPS } from "@/lib/tasks/config";
import { toStringArray } from "@/lib/tasks/types";
import { starterStepRequestSchema } from "@/lib/validation/ai";

/**
 * Generates one AI starter step per saved task (strict per-task limit).
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = starterStepRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const { taskId, title, description, starterStepPrompt, aiProvider, localModel } = parsed.data;

  try {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: session.user.id,
      },
      select: {
        id: true,
        tips: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const generated = await generateStarterStep({
      provider: aiProvider ?? "LOCAL",
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
          aiProvider: aiProvider ?? "LOCAL",
          aiStepsGenerationStatus: "READY",
          starterStep: generated.starterStep,
          aiGeneratedSteps: generatedTodoSteps,
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
      starterStep: generated.starterStep,
      todoSteps: generated.todoSteps,
      tips: mergedTips,
      usage: generated.usage,
    });
  } catch (error) {
    try {
      await prisma.task.update({
        where: { id: taskId },
        data: { aiStepsGenerationStatus: "FAILED" },
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
