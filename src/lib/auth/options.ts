import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { credentialsSchema } from "@/lib/validation/auth";

interface AuthUser {
  id: string;
  email: string;
}

/**
 * Validates submitted credentials and returns the authenticated user payload.
 */
async function authorizeCredentials(
  rawCredentials: unknown,
): Promise<AuthUser | null> {
  const parsed = credentialsSchema.safeParse(rawCredentials);

  if (!parsed.success) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      email: parsed.data.email,
    },
  });

  if (!user) {
    return null;
  }

  const passwordMatches = await verifyPassword(
    parsed.data.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}

/**
 * Shared NextAuth configuration for credentials authentication.
 */
export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: authorizeCredentials,
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
};
