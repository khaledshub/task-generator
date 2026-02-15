import { z } from "zod";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 64;

/**
 * Validates credentials used by signup and login forms.
 */
export const credentialsSchema = z.object({
  email: z.string().email().transform((email) => email.toLowerCase().trim()),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
    .max(MAX_PASSWORD_LENGTH, `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`),
});

/**
 * Validates signup input including password confirmation.
 */
export const signupSchema = credentialsSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type CredentialsInput = z.infer<typeof credentialsSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
