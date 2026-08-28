import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { ProtectedHeader } from "@/components/auth/protected-header";
import { requireActiveUser } from "@/lib/auth/guards";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireActiveUser();

  if (user.profile.role === "admin") {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-svh flex-col">
      <ProtectedHeader
        destination="/dashboard"
        email={user.email}
        label="User workspace"
      />
      <section className="flex flex-1">{children}</section>
    </div>
  );
}
