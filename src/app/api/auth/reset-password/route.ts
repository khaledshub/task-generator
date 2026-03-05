import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { hashPasswordResetToken } from "@/lib/auth/password-reset";
import {
  applyAuthFailureDelay,
  getClientIpFromHeaders,
  takeRateLimit,
} from "@/lib/auth/rate-limit";
import { resetPasswordSchema } from "@/lib/validation/password-reset";

const RESET_PASSWORD_MAX_ATTEMPTS = 15;

/**
 * Validates a reset token and updates the corresponding user password hash.
 */
export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(payload);
  const tokenHint =
    parsed.success ? parsed.data.token : String((payload as { token?: string } | null)?.token ?? "");
  const rateLimitKey = `reset:${getClientIpFromHeaders(request.headers)}:${tokenHint.slice(0, 12)}`;
  const rateLimit = takeRateLimit(rateLimitKey, RESET_PASSWORD_MAX_ATTEMPTS);

  if (!rateLimit.allowed) {
    await applyAuthFailureDelay();
    return NextResponse.json(
      { error: "Too many attempts. Please retry shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  if (!parsed.success) {
    await applyAuthFailureDelay();
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid reset request." },
      { status: 400 },
    );
  }

  const now = new Date();
  const tokenHash = hashPasswordResetToken(parsed.data.token);
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: {
        gt: now,
      },
    },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!resetToken) {
    await applyAuthFailureDelay();
    return NextResponse.json(
      { error: "Reset link is invalid or has expired." },
      { status: 400 },
    );
  }

  const newPasswordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: newPasswordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: now },
    }),
    prisma.passwordResetToken.updateMany({
      where: {
        userId: resetToken.userId,
        usedAt: null,
        id: { not: resetToken.id },
      },
      data: { usedAt: now },
    }),
  ]);

  return NextResponse.json({ message: "Password updated." }, { status: 200 });
}
