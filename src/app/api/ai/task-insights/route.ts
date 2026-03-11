import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth/options";
import { generateTaskInsights } from "@/lib/ai/task-insights";
import { logger } from "@/lib/logger";
import { taskInsightsRequestSchema } from "@/lib/validation/ai";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = taskInsightsRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const {
    taskId,
    title,
    description,
    starterStep,
    aiProvider,
    localModel,
    question,
    history,
  } = parsed.data;

  try {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const generated = await generateTaskInsights({
      provider: aiProvider ?? "LOCAL",
      title,
      description,
      starterStep,
      question,
      history,
      localModel,
    });

    return NextResponse.json({
      tips: generated.tips,
      answer: generated.answer,
      usage: generated.usage,
    });
  } catch (error) {
    logger.error({ error, userId: session.user.id, taskId }, "Task insights generation failed");

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not generate task insights.",
      },
      { status: 500 },
    );
  }
}
