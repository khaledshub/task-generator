import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import {
  applyAuthFailureDelay,
  getClientIpFromHeaders,
  takeRateLimit,
} from "@/lib/auth/rate-limit";
import { signupSchema } from "@/lib/validation/auth";

const SIGNUP_MAX_ATTEMPTS = 10;

/**
 * Creates a new local-credentials account.
 */
export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const tentativeEmail =
    typeof payload === "object" && payload && "email" in payload
      ? String(payload.email ?? "").toLowerCase().trim()
      : "";
  const rateLimitKey = `signup:${getClientIpFromHeaders(request.headers)}:${tentativeEmail}`;
  const rateLimit = takeRateLimit(rateLimitKey, SIGNUP_MAX_ATTEMPTS);

  if (!rateLimit.allowed) {
    await applyAuthFailureDelay();
    return NextResponse.json(
      { error: "Too many signup attempts. Please retry shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const parsed = signupSchema.safeParse(payload);

  if (!parsed.success) {
    await applyAuthFailureDelay();
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
    await applyAuthFailureDelay();
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
