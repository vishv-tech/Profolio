import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { ProtectedHeader } from "@/components/auth/protected-header";
import { WorkspaceNavigation } from "@/components/workspace/workspace-navigation";
import { requireActiveUser } from "@/lib/auth/guards";

import styles from "@/components/workspace/workspace.module.css";

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
    <div className={`${styles.shell} flex flex-col`}>
      <ProtectedHeader
        destination="/dashboard"
        email={user.email}
        label="User workspace"
        name={user.profile.full_name || user.profile.username}
      />
      <div className={styles.contentGrid}>
        <WorkspaceNavigation />
        <section className={styles.mainColumn}>{children}</section>
      </div>
    </div>
  );
}
