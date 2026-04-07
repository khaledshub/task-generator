import { Button } from "@mui/material";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { LoginForm } from "@/components/auth/login-form";
import { isGuestEmail } from "@/lib/auth/guest";
import { authOptions } from "@/lib/auth/options";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user && !isGuestEmail(session.user.email)) {
    redirect("/app");
  }

  return (
    <AuthPageShell
      eyebrow="Return to your workspace"
      title="Log in"
      description="Pick up where you left off and keep your task momentum intact."
      supportPoints={[
        "Resume the same weighted task pool across sessions.",
        "Keep AI-assisted starter steps tied to each task.",
        "Review picks, skips, and completions from one workspace.",
      ]}
      footerAction={<Button href="/signup" variant="text">Need an account? Sign up</Button>}
    >
      <LoginForm />
    </AuthPageShell>
  );
}
