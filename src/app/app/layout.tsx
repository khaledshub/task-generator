import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { GuestSessionGuard } from "@/components/auth/guest-session-guard";
import { AppHeader } from "@/components/navigation/app-header";
import { AppShell } from "@/components/ui/app-shell";
import { PageTransition } from "@/components/ui/page-transition";
import { isGuestEmail, purgeExpiredGuestUsers } from "@/lib/auth/guest";
import { authOptions } from "@/lib/auth/options";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await purgeExpiredGuestUsers();
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const isGuest = isGuestEmail(session.user.email);

  return (
    <AppShell header={<AppHeader userEmail={session.user.email} isGuest={isGuest} />}>
      {isGuest ? <GuestSessionGuard /> : null}
      <PageTransition>{children}</PageTransition>
    </AppShell>
  );
}
