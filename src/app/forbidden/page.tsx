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

import styles from "@/components/shared/status-page.module.css";

export default function ForbiddenPage() {
  return (
    <main className={styles.page}>
      <Card>
        <CardHeader className="gap-4 text-center">
          <div className={styles.warningIcon}>
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
