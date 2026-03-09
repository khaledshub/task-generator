import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  createPasswordResetToken,
  getPasswordResetExpiryDate,
  hashPasswordResetToken,
} from "@/lib/auth/password-reset";
import {
  applyAuthFailureDelay,
  getClientIpFromHeaders,
  takeRateLimit,
} from "@/lib/auth/rate-limit";
import { forgotPasswordSchema } from "@/lib/validation/password-reset";

const FORGOT_PASSWORD_MAX_ATTEMPTS = 10;

const GENERIC_SUCCESS_MESSAGE =
  "If an account exists for this email, a reset link has been generated.";

const PASSWORD_RESET_SETUP_WARNING =
  "Password reset storage is unavailable. Run `npm run db:migrate`.";

function isMissingPasswordResetTableError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2021") {
    return false;
  }

  const table = String((error.meta as { table?: string } | undefined)?.table ?? "");
  const modelName = String((error.meta as { modelName?: string } | undefined)?.modelName ?? "");
  return table.includes("PasswordResetToken") || modelName === "PasswordResetToken";
}

/**
 * Creates an expiring reset token for a known user and returns a generic response.
 */
export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(payload);
  const emailHint =
    parsed.success ? parsed.data.email : String((payload as { email?: string } | null)?.email ?? "").trim().toLowerCase();

  const rateLimitKey = `forgot:${getClientIpFromHeaders(request.headers)}:${emailHint}`;
  const rateLimit = takeRateLimit(rateLimitKey, FORGOT_PASSWORD_MAX_ATTEMPTS);

  if (!rateLimit.allowed) {
    await applyAuthFailureDelay();
    return NextResponse.json(
      { message: GENERIC_SUCCESS_MESSAGE },
      {
        status: 200,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  if (!parsed.success) {
    await applyAuthFailureDelay();
    return NextResponse.json({ message: GENERIC_SUCCESS_MESSAGE }, { status: 200 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true },
  });

  if (!user) {
    await applyAuthFailureDelay();
    return NextResponse.json({ message: GENERIC_SUCCESS_MESSAGE }, { status: 200 });
  }

  const rawToken = createPasswordResetToken();
  const tokenHash = hashPasswordResetToken(rawToken);
  const expiresAt = getPasswordResetExpiryDate();

  try {
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });
  } catch (error) {
    if (!isMissingPasswordResetTableError(error)) {
      throw error;
    }

    logger.error({ error }, "Password reset table is missing");
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json(
        { message: GENERIC_SUCCESS_MESSAGE, warning: PASSWORD_RESET_SETUP_WARNING },
        { status: 200 },
      );
    }

    return NextResponse.json({ message: GENERIC_SUCCESS_MESSAGE }, { status: 200 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

  if (process.env.NODE_ENV !== "production") {
    logger.info({ userId: user.id, email: user.email, resetUrl }, "Password reset URL generated");
    return NextResponse.json({ message: GENERIC_SUCCESS_MESSAGE, resetUrl }, { status: 200 });
  }

  logger.info({ userId: user.id, email: user.email }, "Password reset requested");
  return NextResponse.json({ message: GENERIC_SUCCESS_MESSAGE }, { status: 200 });
}
