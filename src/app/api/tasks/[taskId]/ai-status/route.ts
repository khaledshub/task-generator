import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth/options";

interface TaskAiStatusRouteContext {
  params: Promise<{
    taskId: string;
  }>;
}

export async function GET(_request: Request, context: TaskAiStatusRouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await context.params;

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      userId: session.user.id,
    },
    select: {
      aiStepsGenerationStatus: true,
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({
    aiStepsGenerationStatus: task.aiStepsGenerationStatus,
  });
}
