import { redirect } from "next/navigation";
import Link from "next/link";
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
      <nav
        aria-label="Workspace navigation"
        className="flex gap-1 border-b bg-background px-4 py-2 sm:px-6"
      >
        <Link className="rounded-md px-3 py-1.5 text-sm hover:bg-muted" href="/dashboard">
          Dashboard
        </Link>
        <Link className="rounded-md px-3 py-1.5 text-sm hover:bg-muted" href="/dashboard/analytics">
          Analytics
        </Link>
        <Link className="rounded-md px-3 py-1.5 text-sm hover:bg-muted" href="/dashboard/export">
          Export
        </Link>
      </nav>
      <section className="flex flex-1">{children}</section>
    </div>
  );
}
