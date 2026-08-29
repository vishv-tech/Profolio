export type AdminAccessInput =
  | { status: "anonymous" }
  | { status: "profile-unavailable" }
  | {
      status: "authenticated";
      role: "user" | "admin";
      accountStatus: "active" | "suspended";
    };

export type AdminAccessDecision =
  | { allowed: true }
  | { allowed: false; destination: string };

export function decideAdminAccess(
  input: AdminAccessInput,
): AdminAccessDecision {
  if (input.status === "anonymous") {
    return { allowed: false, destination: "/login?next=/admin" };
  }

  if (input.status === "profile-unavailable") {
    return { allowed: false, destination: "/auth/error?code=profile" };
  }

  if (input.accountStatus === "suspended") {
    return { allowed: false, destination: "/account-suspended" };
  }

  if (input.role !== "admin") {
    return { allowed: false, destination: "/forbidden" };
  }

  return { allowed: true };
}
