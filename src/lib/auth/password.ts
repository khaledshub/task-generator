import bcrypt from "bcryptjs";

const PASSWORD_SALT_ROUNDS = 12;

/**
 * Hashes a plain text password for secure storage.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

/**
 * Validates a plain text password against a stored hash.
 */
export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
