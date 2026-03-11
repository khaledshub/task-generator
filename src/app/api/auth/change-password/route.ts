import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth/options";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  applyAuthFailureDelay,
  clearRateLimit,
  getClientIpFromHeaders,
  takeRateLimit,
} from "@/lib/auth/rate-limit";
import { logger } from "@/lib/logger";
import { changePasswordSchema } from "@/lib/validation/auth";

const CHANGE_PASSWORD_MAX_ATTEMPTS = 12;

/**
 * Updates the authenticated user's password after validating the current password.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const rateLimitKey = `change-password:${getClientIpFromHeaders(request.headers)}:${userId}`;
  const rateLimit = takeRateLimit(rateLimitKey, CHANGE_PASSWORD_MAX_ATTEMPTS);

  if (!rateLimit.allowed) {
    await applyAuthFailureDelay();
    return NextResponse.json(
      { error: "Too many attempts. Please retry shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(payload);

  if (!parsed.success) {
    await applyAuthFailureDelay();
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid password change request." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    await applyAuthFailureDelay();
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const currentPasswordIsValid = await verifyPassword(
    parsed.data.currentPassword,
    user.passwordHash,
  );

  if (!currentPasswordIsValid) {
    await applyAuthFailureDelay();
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  const nextPasswordHash = await hashPassword(parsed.data.newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: nextPasswordHash },
  });

  clearRateLimit(rateLimitKey);
  logger.info({ userId: user.id }, "Password changed by authenticated user");

  return NextResponse.json({ message: "Password updated successfully." }, { status: 200 });
}
