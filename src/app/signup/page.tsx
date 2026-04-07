import { Button } from "@mui/material";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { isGuestEmail } from "@/lib/auth/guest";
import { authOptions } from "@/lib/auth/options";

export default async function SignupPage() {
  const session = await getServerSession(authOptions);

  if (session?.user && !isGuestEmail(session.user.email)) {
    redirect("/app");
  }

  return (
    <AuthPageShell
      eyebrow="Build your decision engine"
      title="Create account"
      description="Start a workspace that turns your backlog into one credible next action."
      supportPoints={[
        "Capture tasks with context, energy, and time constraints.",
        "Let the picker surface one best-fit action instead of five maybes.",
        "Track what got picked, skipped, started, and finished.",
      ]}
      footerAction={<Button href="/login" variant="text">Already have an account? Log in</Button>}
    >
      <SignupForm />
    </AuthPageShell>
  );
}
