import bcrypt from "bcryptjs";

const PASSWORD_SALT_ROUNDS = 12;
const PASSWORD_PEPPER = process.env.AUTH_PASSWORD_PEPPER ?? "";

function withPepper(password: string): string {
  return `${password}${PASSWORD_PEPPER}`;
}

/**
 * Hashes a plain text password for secure storage.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(withPepper(password), PASSWORD_SALT_ROUNDS);
}

/**
 * Validates a plain text password against a stored hash.
 */
export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(withPepper(password), passwordHash);
}
