import Link from "next/link";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { redirectAuthenticatedUser } from "@/lib/auth/guards";

export default async function SignupPage() {
  await redirectAuthenticatedUser();

  return (
    <AuthPageShell
      description="Create your account. You may need to confirm your email before continuing."
      footer={
        <>
          Already have an account?{" "}
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline"
            href="/login"
          >
            Log in
          </Link>
        </>
      }
      title="Create your account"
    >
      <SignupForm />
    </AuthPageShell>
  );
}
