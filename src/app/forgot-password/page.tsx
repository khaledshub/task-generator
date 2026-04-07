import { Button } from "@mui/material";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { authOptions } from "@/lib/auth/options";

export default async function ForgotPasswordPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/app");
  }

  return (
    <AuthPageShell
      eyebrow="Recover access"
      title="Forgot password"
      description="Enter your account email and we’ll send a reset link."
      supportPoints={[
        "Reset links are scoped to your account.",
        "Your tasks, picks, and history stay intact.",
        "Create a fresh password without rebuilding your workspace.",
      ]}
      footerAction={<Button href="/login" variant="text">Back to login</Button>}
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
