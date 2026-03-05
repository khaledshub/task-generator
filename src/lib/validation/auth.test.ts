import { describe, expect, it } from "vitest";
import { credentialsSchema, signupSchema } from "@/lib/validation/auth";

describe("auth validation", () => {
  it("accepts valid credential input and normalizes email", () => {
    const parsed = credentialsSchema.safeParse({
      email: "  USER@EXAMPLE.COM  ",
      password: "S3cure!Pass",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe("user@example.com");
    }
  });

  it("rejects weak passwords", () => {
    const parsed = credentialsSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects mismatched signup confirmation", () => {
    const parsed = signupSchema.safeParse({
      email: "user@example.com",
      password: "S3cure!Pass",
      confirmPassword: "Different!Pass1",
    });

    expect(parsed.success).toBe(false);
  });
});
