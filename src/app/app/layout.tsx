import { Box, Container } from "@mui/material";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/navigation/app-header";
import { PageTransition } from "@/components/ui/page-transition";
import { authOptions } from "@/lib/auth/options";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "transparent" }}>
      <AppHeader userEmail={session.user.email} />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageTransition>{children}</PageTransition>
      </Container>
    </Box>
  );
}
