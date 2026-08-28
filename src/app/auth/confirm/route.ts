import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { readAuthContext } from "@/lib/auth/guards";
import { pathForUserRoleWithSafeNext } from "@/lib/auth/redirects";
import { getOptionalSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const SUPPORTED_CONFIRMATION_TYPES = new Set<EmailOtpType>([
  "email",
  "signup",
]);

function internalRedirect(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const nextPath = request.nextUrl.searchParams.get("next");

  if (!getOptionalSupabasePublicEnv()) {
    return internalRedirect(request, "/auth/error?code=confirmation");
  }

  const supabase = await createClient();

  try {
    if (code) {
      if (code.length > 4096) {
        return internalRedirect(request, "/auth/error?code=confirmation");
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        return internalRedirect(request, "/auth/error?code=confirmation");
      }
    } else {
      if (
        !tokenHash ||
        tokenHash.length > 4096 ||
        !type ||
        !SUPPORTED_CONFIRMATION_TYPES.has(type)
      ) {
        return internalRedirect(request, "/auth/error?code=confirmation");
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });

      if (error) {
        return internalRedirect(request, "/auth/error?code=confirmation");
      }
    }
  } catch {
    return internalRedirect(request, "/auth/error?code=confirmation");
  }

  const result = await readAuthContext(supabase);

  if (result.status !== "authenticated") {
    await supabase.auth.signOut({ scope: "local" });
    return internalRedirect(request, "/auth/error?code=profile");
  }

  if (result.context.profile.account_status === "suspended") {
    await supabase.auth.signOut({ scope: "local" });
  }

  return internalRedirect(
    request,
    pathForUserRoleWithSafeNext(result.context.profile, nextPath),
  );
}
