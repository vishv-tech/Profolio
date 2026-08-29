import "server-only";

import { redirect } from "next/navigation";

import { decideAdminAccess } from "@/lib/admin/access-policy";
import { readAuthContext, type AdminUser } from "@/lib/auth/guards";
import { getOptionalSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin(): Promise<AdminUser> {
  if (!getOptionalSupabasePublicEnv()) {
    redirect("/login?next=/admin");
  }

  const result = await readAuthContext(await createClient());
  const decision = decideAdminAccess(
    result.status === "authenticated"
      ? {
          status: "authenticated",
          role: result.context.profile.role,
          accountStatus: result.context.profile.account_status,
        }
      : { status: result.status },
  );

  if (!decision.allowed) {
    redirect(decision.destination);
  }

  if (result.status !== "authenticated") {
    redirect("/forbidden");
  }

  return {
    ...result.context,
    profile: {
      ...result.context.profile,
      role: "admin",
      account_status: "active",
    },
  };
}
