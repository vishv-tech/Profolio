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
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-12 sm:px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="gap-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
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
