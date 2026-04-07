import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth/options";
import { getTaskAiStatusSnapshot } from "@/lib/tasks/ai-lifecycle";

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
      updatedAt: true,
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const snapshot = getTaskAiStatusSnapshot(
    task.aiStepsGenerationStatus,
    task.updatedAt,
  );

  return NextResponse.json({
    aiStepsGenerationStatus: snapshot.aiStepsGenerationStatus,
    isStalePending: snapshot.isStalePending,
    message: snapshot.message,
  });
}
