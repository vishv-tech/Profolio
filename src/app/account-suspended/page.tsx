import { ShieldX } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import styles from "@/components/shared/status-page.module.css";

export default function AccountSuspendedPage() {
  return (
    <main className={styles.page}>
      <Card>
        <CardHeader className="gap-4 text-center">
          <div className={styles.warningIcon}>
            <ShieldX aria-hidden="true" className="size-5" />
          </div>
          <div className="space-y-2">
            <CardTitle>
              <h1 className="text-2xl font-semibold tracking-tight">
                Account suspended
              </h1>
            </CardTitle>
            <CardDescription className="text-base leading-6">
              Your account is currently unavailable. Please contact the
              platform administrator if you believe this is an error.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center">
          <LogoutButton />
        </CardContent>
      </Card>
    </main>
  );
}
