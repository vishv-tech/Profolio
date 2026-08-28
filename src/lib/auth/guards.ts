import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { redirectForUserRole } from "@/lib/auth/redirects";
import { getOptionalSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type AuthProfile = Omit<
  ProfileRow,
  "role" | "account_status"
> & {
  role: "user" | "admin";
  account_status: "active" | "suspended";
};

const ProfileSchema: z.ZodType<AuthProfile> = z.strictObject({
  id: z.string().uuid(),
  username: z.string().nullable(),
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  role: z.enum(["user", "admin"]),
  account_status: z.enum(["active", "suspended"]),
  created_at: z.string(),
  updated_at: z.string(),
});

const PROFILE_COLUMNS =
  "id, username, full_name, avatar_url, role, account_status, created_at, updated_at";

export type VerifiedUser = {
  userId: string;
  email: string | null;
};

export type ActiveUser = VerifiedUser & {
  profile: AuthProfile & { account_status: "active" };
};

export type AdminUser = ActiveUser & {
  profile: ActiveUser["profile"] & { role: "admin" };
};

type AuthContext = VerifiedUser & {
  profile: AuthProfile;
};

export type AuthLookupResult =
  | { status: "anonymous" }
  | { status: "profile-unavailable" }
  | { status: "authenticated"; context: AuthContext };

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function readVerifiedUser(
  supabase: ServerSupabaseClient,
): Promise<VerifiedUser | null> {
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims.sub) {
    return null;
  }

  return {
    userId: data.claims.sub,
    email:
      typeof data.claims.email === "string" ? data.claims.email : null,
  };
}

export async function readAuthContext(
  supabase: ServerSupabaseClient,
): Promise<AuthLookupResult> {
  const user = await readVerifiedUser(supabase);

  if (!user) {
    return { status: "anonymous" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.userId)
    .maybeSingle();

  if (error || !data) {
    return { status: "profile-unavailable" };
  }

  const profile = ProfileSchema.safeParse(data);

  if (!profile.success || profile.data.id !== user.userId) {
    return { status: "profile-unavailable" };
  }

  return {
    status: "authenticated",
    context: { ...user, profile: profile.data },
  };
}

const readCurrentUser = cache(async (): Promise<VerifiedUser | null> => {
  // Auth decisions are request-specific even when local Supabase values have
  // not been configured yet. This prevents a missing-env build from baking a
  // permanent anonymous result into protected routes.
  await cookies();

  if (!getOptionalSupabasePublicEnv()) {
    return null;
  }

  return readVerifiedUser(await createClient());
});

const readCurrentAuthContext = cache(async (): Promise<AuthLookupResult> => {
  await cookies();

  if (!getOptionalSupabasePublicEnv()) {
    return { status: "anonymous" };
  }

  return readAuthContext(await createClient());
});

export async function requireUser(): Promise<VerifiedUser> {
  const user = await readCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireActiveUser(): Promise<ActiveUser> {
  const result = await readCurrentAuthContext();

  if (result.status === "anonymous") {
    redirect("/login");
  }

  if (result.status === "profile-unavailable") {
    redirect("/auth/error?code=profile");
  }

  if (result.context.profile.account_status === "suspended") {
    redirect("/account-suspended");
  }

  return {
    ...result.context,
    profile: {
      ...result.context.profile,
      account_status: "active",
    },
  };
}

export async function requireAdmin(): Promise<AdminUser> {
  const user = await requireActiveUser();

  if (user.profile.role !== "admin") {
    redirect("/dashboard");
  }

  return {
    ...user,
    profile: {
      ...user.profile,
      role: "admin",
    },
  };
}

export async function redirectAuthenticatedUser(): Promise<void> {
  const result = await readCurrentAuthContext();

  if (result.status === "anonymous") {
    return;
  }

  if (result.status === "profile-unavailable") {
    redirect("/auth/error?code=profile");
  }

  redirectForUserRole(result.context.profile);
}
