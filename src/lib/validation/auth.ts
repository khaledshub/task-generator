import { z } from "zod";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 64;
const PASSWORD_STRENGTH_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

/**
 * Validates credentials used by signup and login forms.
 */
export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
    .max(MAX_PASSWORD_LENGTH, `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`)
    .regex(
      PASSWORD_STRENGTH_PATTERN,
      "Password must include uppercase, lowercase, number, and symbol.",
    ),
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

/**
 * Validates an authenticated password change request.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: credentialsSchema.shape.password,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "New password must be different from your current password.",
  });

export type CredentialsInput = z.infer<typeof credentialsSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
