"use client";

import { BarChart3, Download, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

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
    <aside className="border-b bg-background md:border-b-0 md:border-r">
      <nav
        aria-label="Portfolio workspace"
        className="flex max-w-full gap-1 overflow-x-auto px-3 py-2 md:sticky md:top-0 md:flex-col md:overflow-visible md:px-3 md:py-5"
      >
        <p className="hidden px-3 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground md:block">
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
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
