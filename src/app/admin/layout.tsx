import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin/require-admin";

import "./admin.css";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <AdminShell
      identity={{
        email: admin.email,
        profile: {
          avatar_url: admin.profile.avatar_url,
          full_name: admin.profile.full_name,
          username: admin.profile.username,
        },
      }}
    >
      {children}
    </AdminShell>
  );
}
