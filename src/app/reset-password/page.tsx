import { Alert, Button } from "@mui/material";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { authOptions } from "@/lib/auth/options";

interface ResetPasswordPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/app");
  }

  const resolvedParams = await searchParams;
  const tokenValue = resolvedParams.token;
  const token = Array.isArray(tokenValue) ? tokenValue[0] : tokenValue;

  return (
    <AuthPageShell
      eyebrow="Secure your account"
      title="Reset password"
      description="Choose a new password and return to your task workspace."
      supportPoints={[
        "Use the link from your email to continue securely.",
        "Your existing task data and history remain unchanged.",
        "Once reset, you can return directly to picking the next task.",
      ]}
      footerAction={<Button href="/login" variant="text">Back to login</Button>}
    >
      {!token ? (
        <>
          <Alert severity="error">Reset link is missing or invalid.</Alert>
          <Button href="/forgot-password" variant="contained">
            Request new link
          </Button>
        </>
      ) : (
        <ResetPasswordForm token={token} />
      )}
    </AuthPageShell>
  );
}
