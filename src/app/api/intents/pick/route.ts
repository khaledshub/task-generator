import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createIntentAndPickTask } from "@/lib/picker/service";
import { intentInputSchema } from "@/lib/validation/picker";

/**
 * Creates a DailyIntent and returns a weighted-random task pick result.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = intentInputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid intent payload." },
      { status: 400 },
    );
  }

  const result = await createIntentAndPickTask(session.user.id, parsed.data);

  return NextResponse.json(result);
}
