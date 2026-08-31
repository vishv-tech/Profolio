"use client";

import {
  BarChart3,
  BriefcaseBusiness,
  Cloud,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Palette,
  Search,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { logout } from "@/lib/auth/actions";

export type AvatarProfile = {
  avatar_url: string | null;
  full_name: string | null;
  username: string | null;
};

type AdminIdentity = {
  email: string | null;
  profile: AvatarProfile;
};

const navigation = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users, exact: false },
  { href: "/admin/portfolios", label: "Portfolios", icon: BriefcaseBusiness, exact: false },
  { href: "/admin/resumes", label: "Resumes", icon: FileText, exact: false },
  { href: "/admin/themes", label: "Themes", icon: Palette, exact: false },
  { href: "/admin/deployments", label: "Deployments", icon: Cloud, exact: false },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, exact: false },
] as const;

function displayName(identity: AdminIdentity): string {
  return identity.profile.full_name || identity.profile.username || "Admin";
}

export function Avatar({
  profile,
  small = false,
}: {
  profile: AvatarProfile;
  small?: boolean;
}) {
  const className = `admin-avatar${small ? " admin-avatar--small" : ""}`;

  if (profile.avatar_url) {
    // Avatar hosts are supplied by the configured Storage project.
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={className} src={profile.avatar_url} alt="" />;
  }

  const name = profile.full_name || profile.username || "Admin";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return <span className={`${className} admin-avatar--fallback`}>{initials}</span>;
}

export function AdminShell({
  children,
  identity,
}: {
  children: ReactNode;
  identity: AdminIdentity;
}) {
  const pathname = usePathname();
  const name = displayName(identity);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin" aria-label="Profolio admin">
          <span className="admin-brand__mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span className="admin-brand__copy">
            <strong>Profolio</strong>
            <small>Admin console</small>
          </span>
        </Link>
        <nav className="admin-nav" aria-label="Admin navigation">
          {navigation.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`admin-nav__link${active ? " is-active" : ""}`}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar__footer">
          <Link className="admin-nav__link" href="/">
            <ExternalLink aria-hidden="true" />
            <span>Back to app</span>
          </Link>
          <div className="admin-identity">
            <Avatar profile={identity.profile} />
            <span>
              <strong>{name}</strong>
              {identity.email ? <small>{identity.email}</small> : null}
            </span>
          </div>
          <form action={logout}>
            <button className="admin-signout" type="submit">
              <LogOut aria-hidden="true" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <form className="admin-search" action="/admin/search" role="search">
            <Search aria-hidden="true" />
            <input
              name="q"
              type="search"
              placeholder="Search users, portfolios, resumes..."
              aria-label="Search admin records"
            />
          </form>
          <div className="admin-topbar__identity">
            <Avatar profile={identity.profile} small />
            <span>{name}</span>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
