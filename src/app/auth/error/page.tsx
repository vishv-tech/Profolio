import { CircleAlert } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import styles from "@/components/shared/status-page.module.css";

const errorMessages: Record<string, string> = {
  confirmation:
    "That confirmation link is invalid or has expired. Request a new account confirmation and try again.",
  profile:
    "Your identity was verified, but the application profile is unavailable. Please contact the platform administrator.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  const { code } = await searchParams;
  const safeCode = typeof code === "string" ? code : "";
  const message =
    errorMessages[safeCode] ??
    "The authentication flow could not be completed. Please try again.";

  return (
    <main className={styles.page}>
      <Card>
        <CardHeader className="gap-4 text-center">
          <div className={styles.warningIcon}>
            <CircleAlert aria-hidden="true" className="size-5" />
          </div>
          <div className="space-y-2">
            <CardTitle>
              <h1 className="text-2xl font-semibold tracking-tight">
                Authentication problem
              </h1>
            </CardTitle>
            <CardDescription className="text-base leading-6">
              {message}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link className={buttonVariants({ size: "lg" })} href="/login">
            Return to login
          </Link>
          <Link
            className={buttonVariants({ variant: "outline", size: "lg" })}
            href="/"
          >
            Go home
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
