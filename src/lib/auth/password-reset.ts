import { createHash, randomBytes } from "node:crypto";

export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;

/**
 * Returns a cryptographically strong token for password reset links.
 */
export function createPasswordResetToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Hashes a raw token before storing it in the database.
 */
export function hashPasswordResetToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Returns the token expiry timestamp using the configured TTL.
 */
export function getPasswordResetExpiryDate(): Date {
  return new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);
}
