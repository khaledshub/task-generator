import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { createGuestUser, purgeExpiredGuestUsers } from "@/lib/auth/guest";
import { verifyPassword } from "@/lib/auth/password";
import {
  applyAuthFailureDelay,
  clearRateLimit,
  getClientIpFromHeaders,
  takeRateLimit,
} from "@/lib/auth/rate-limit";
import { credentialsSchema } from "@/lib/validation/auth";

interface AuthUser {
  id: string;
  email: string;
  isGuest?: boolean;
}

const LOGIN_MAX_ATTEMPTS = 15;

/**
 * Validates submitted credentials and returns the authenticated user payload.
 */
async function authorizeCredentials(
  rawCredentials: unknown,
  request: { headers?: Headers | Record<string, string | string[] | undefined> } | undefined,
): Promise<AuthUser | null> {
  const parsed = credentialsSchema.safeParse(rawCredentials);
  const normalizedEmail =
    parsed.success && parsed.data.email ? parsed.data.email : String((rawCredentials as { email?: string } | null)?.email ?? "").toLowerCase().trim();
  const headers = request?.headers ?? {};
  const rateLimitKey = `login:${getClientIpFromHeaders(headers)}:${normalizedEmail}`;
  const rateLimit = takeRateLimit(rateLimitKey, LOGIN_MAX_ATTEMPTS);

  if (!rateLimit.allowed) {
    await applyAuthFailureDelay();
    return null;
  }

  if (!parsed.success) {
    await applyAuthFailureDelay();
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      email: parsed.data.email,
    },
  });

  if (!user) {
    await applyAuthFailureDelay();
    return null;
  }

  const passwordMatches = await verifyPassword(
    parsed.data.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    await applyAuthFailureDelay();
    return null;
  }

  clearRateLimit(rateLimitKey);

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
    maxAge: 60 * 60 * 24 * 7,
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 7,
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: (credentials, request) => authorizeCredentials(credentials, request),
    }),
    CredentialsProvider({
      id: "guest",
      name: "Guest",
      credentials: {},
      authorize: async () => createGuestUser(),
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.isGuest = (user as AuthUser).isGuest === true;
      }

      if (token.isGuest === true) {
        await purgeExpiredGuestUsers();
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.isGuest = token.isGuest === true;
      }

      return session;
    },
  },
};
