import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";

type ProtectedHeaderProps = {
  destination: string;
  label: string;
  email: string | null;
};

export function ProtectedHeader({
  destination,
  label,
  email,
}: ProtectedHeaderProps) {
  return (
    <header className="flex min-h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
      <Link
        className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        href={destination}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck aria-hidden="true" className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{label}</span>
          {email ? (
            <span className="block truncate text-xs text-muted-foreground">
              {email}
            </span>
          ) : null}
        </span>
      </Link>
      <LogoutButton />
    </header>
  );
}
