import prisma from "@/lib/prisma";

const GUEST_EMAIL_PREFIX = "guest+";
const GUEST_EMAIL_DOMAIN = "guest.local";
const GUEST_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export function isGuestEmail(email?: string | null): boolean {
  if (!email) {
    return false;
  }

  return (
    email.startsWith(GUEST_EMAIL_PREFIX) &&
    email.endsWith(`@${GUEST_EMAIL_DOMAIN}`)
  );
}

export async function createGuestUser(): Promise<{
  id: string;
  email: string;
  isGuest: true;
}> {
  await purgeExpiredGuestUsers();

  const user = await prisma.user.create({
    data: {
      email: `${GUEST_EMAIL_PREFIX}${crypto.randomUUID()}@${GUEST_EMAIL_DOMAIN}`,
      passwordHash: `guest:${crypto.randomUUID()}`,
    },
    select: {
      id: true,
      email: true,
    },
  });

  return {
    ...user,
    isGuest: true,
  };
}

export async function purgeExpiredGuestUsers(): Promise<void> {
  const cutoff = new Date(Date.now() - GUEST_RETENTION_MS);

  await prisma.user.deleteMany({
    where: {
      email: { startsWith: GUEST_EMAIL_PREFIX },
      createdAt: { lt: cutoff },
    },
  });
}

export async function purgeGuestUserById(userId: string): Promise<void> {
  await prisma.user.deleteMany({
    where: {
      id: userId,
      email: { startsWith: GUEST_EMAIL_PREFIX },
    },
  });
}
