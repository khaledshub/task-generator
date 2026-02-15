import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createTaskStatusEvent } from "@/lib/picker/service";
import { pickEventActionSchema } from "@/lib/validation/picker";

/**
 * Persists STARTED, DONE, or SKIPPED status events for a task.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = pickEventActionSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid pick event payload." },
      { status: 400 },
    );
  }

  try {
    const event = await createTaskStatusEvent(session.user.id, parsed.data);
    return NextResponse.json({ id: event.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create task status event.",
      },
      { status: 400 },
    );
  }
}
