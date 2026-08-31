import { FileText } from "lucide-react";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";

import styles from "@/components/workspace/workspace.module.css";

type ProtectedHeaderProps = {
  destination: string;
  label: string;
  email: string | null;
  name?: string | null;
};

function initials(value: string) {
  return (
    value
      .trim()
      .split(/\s+/u)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "PF"
  );
}

export function ProtectedHeader({
  destination,
  label,
  email,
  name,
}: ProtectedHeaderProps) {
  const displayName = name?.trim() || email?.split("@")[0] || "Account";

  return (
    <header className={styles.topbar}>
      <Link
        className={styles.brand}
        href={destination}
      >
        <span className={styles.brandMark}>
          <FileText aria-hidden="true" className="size-4" />
        </span>
        <span>
          <span className={styles.brandName}>Profolio</span>
          <span className={styles.brandContext}>{label}</span>
        </span>
      </Link>
      <div className={styles.account}>
        <div className={styles.identity} aria-label={`Signed in as ${displayName}`}>
          <span className={styles.avatar} aria-hidden="true">
            {initials(displayName)}
          </span>
          <span className={styles.identityName}>{displayName}</span>
        </div>
        <div className={styles.signout}>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
