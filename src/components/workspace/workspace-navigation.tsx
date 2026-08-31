"use client";

import { BarChart3, Download, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

import styles from "./workspace.module.css";

const ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/export", label: "Export", icon: Download },
] as const;

export function WorkspaceNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const portfolioId = searchParams.get("portfolio");

  return (
    <aside className={styles.sidebar}>
      <nav
        aria-label="Portfolio workspace"
        className={styles.navigation}
      >
        <p className={styles.navLabel}>
          Workspace
        </p>
        {ITEMS.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          const href = portfolioId
            ? `${item.href}?portfolio=${encodeURIComponent(portfolioId)}`
            : item.href;
          const Icon = item.icon;

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                styles.navItem,
                active && styles.navItemActive,
              )}
              href={href}
              key={item.href}
            >
              <Icon aria-hidden="true" className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
