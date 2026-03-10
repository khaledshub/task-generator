import { Box, Container } from "@mui/material";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { GuestSessionGuard } from "@/components/auth/guest-session-guard";
import { AppHeader } from "@/components/navigation/app-header";
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
    <Box sx={{ minHeight: "100vh", bgcolor: "transparent" }}>
      <AppHeader userEmail={session.user.email} isGuest={isGuest} />
      {isGuest ? <GuestSessionGuard /> : null}

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageTransition>{children}</PageTransition>
      </Container>
    </Box>
  );
}
