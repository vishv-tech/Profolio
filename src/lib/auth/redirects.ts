import { redirect } from "next/navigation";

export type AuthorizationProfile = {
  role: "user" | "admin";
  account_status: "active" | "suspended";
};

export function pathForUserRole(profile: AuthorizationProfile): string {
  if (profile.account_status === "suspended") {
    return "/account-suspended";
  }

  return profile.role === "admin" ? "/admin" : "/dashboard";
}

function isRoleAllowedInternalPath(
  candidate: string | null,
  profile: AuthorizationProfile,
): candidate is string {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return false;
  }

  if (candidate.includes("\\") || /[\u0000-\u001f]/.test(candidate)) {
    return false;
  }

  let parsed: URL;

  try {
    parsed = new URL(candidate, "https://profolio.invalid");
  } catch {
    return false;
  }

  if (parsed.origin !== "https://profolio.invalid") {
    return false;
  }

  if (profile.account_status !== "active") {
    return false;
  }

  const pathname = parsed.pathname;

  if (profile.role === "admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/");
  }

  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/upload" ||
    pathname === "/themes"
  );
}

export function pathForUserRoleWithSafeNext(
  profile: AuthorizationProfile,
  nextPath: string | null,
): string {
  return isRoleAllowedInternalPath(nextPath, profile)
    ? nextPath
    : pathForUserRole(profile);
}

export function redirectForUserRole(profile: AuthorizationProfile): never {
  redirect(pathForUserRole(profile));
}
