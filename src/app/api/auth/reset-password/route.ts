import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { hashPasswordResetToken } from "@/lib/auth/password-reset";
import { logger } from "@/lib/logger";
import {
  applyAuthFailureDelay,
  getClientIpFromHeaders,
  takeRateLimit,
} from "@/lib/auth/rate-limit";
import { resetPasswordSchema } from "@/lib/validation/password-reset";

const RESET_PASSWORD_MAX_ATTEMPTS = 15;
const RESET_PASSWORD_UNAVAILABLE_MESSAGE =
  "Password reset is temporarily unavailable. Please try again later.";

function isMissingPasswordResetTableError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2021") {
    return false;
  }

  const table = String((error.meta as { table?: string } | undefined)?.table ?? "");
  const modelName = String((error.meta as { modelName?: string } | undefined)?.modelName ?? "");
  return table.includes("PasswordResetToken") || modelName === "PasswordResetToken";
}

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

  try {
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
  } catch (error) {
    if (!isMissingPasswordResetTableError(error)) {
      throw error;
    }

    logger.error({ error }, "Password reset table is missing");
    return NextResponse.json({ error: RESET_PASSWORD_UNAVAILABLE_MESSAGE }, { status: 503 });
  }

  return NextResponse.json({ message: "Password updated." }, { status: 200 });
}
