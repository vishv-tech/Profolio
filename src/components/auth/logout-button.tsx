import { LogOut } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        className={buttonVariants({ variant: "outline", size: "sm" })}
        type="submit"
      >
        <LogOut aria-hidden="true" />
        Sign out
      </button>
    </form>
  );
}
