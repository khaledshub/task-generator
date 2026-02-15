import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";

/**
 * Returns the authenticated user id or redirects to login when unauthenticated.
 */
export async function requireSessionUserId(): Promise<string> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user.id;
}
