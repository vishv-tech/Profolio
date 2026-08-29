import { ShieldX } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-12 sm:px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="gap-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldX aria-hidden="true" className="size-5" />
          </div>
          <div className="space-y-2">
            <CardTitle>
              <h1 className="text-2xl font-semibold tracking-tight">Admin access required</h1>
            </CardTitle>
            <CardDescription className="text-base leading-6">
              Your active account does not have the administrator role required for this area.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link className={buttonVariants({ size: "lg" })} href="/dashboard">
            Return to dashboard
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
