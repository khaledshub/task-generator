import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signupSchema } from "@/lib/validation/auth";

/**
 * Creates a new local-credentials account.
 */
export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid signup request." },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: {
      email: parsed.data.email,
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "An account already exists with this email." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
