import Link from "next/link";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { LoginForm } from "@/components/auth/login-form";
import { redirectAuthenticatedUser } from "@/lib/auth/guards";

export default async function LoginPage() {
  await redirectAuthenticatedUser();

  return (
    <AuthPageShell
      description="Continue building and sharing your professional story."
      footer={
        <>
          New to Profolio?{" "}
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline"
            href="/signup"
          >
            Create an account
          </Link>
        </>
      }
      title="Welcome back"
    >
      <LoginForm />
    </AuthPageShell>
  );
}
