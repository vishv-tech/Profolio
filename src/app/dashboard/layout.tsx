import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { ProtectedHeader } from "@/components/auth/protected-header";
import { WorkspaceNavigation } from "@/components/workspace/workspace-navigation";
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
      <div className="grid min-w-0 flex-1 grid-rows-[auto_minmax(0,1fr)] md:grid-cols-[14rem_minmax(0,1fr)] md:grid-rows-1">
        <WorkspaceNavigation />
        <section className="flex min-w-0">{children}</section>
      </div>
    </div>
  );
}
