import type { ReactNode } from "react";

import { ProtectedHeader } from "@/components/auth/protected-header";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-svh flex-col">
      <ProtectedHeader
        destination="/admin"
        email={admin.email}
        label="Admin workspace"
      />
      <section className="flex flex-1">{children}</section>
    </div>
  );
}
