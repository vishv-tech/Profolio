import type { AccountStatus, UserRole } from "@/types/admin";

type TargetAccount = {
  actorId: string;
  targetId: string;
  targetRole: UserRole;
  targetStatus: AccountStatus;
  activeAdminCount: number;
};

export function assertAccountStatusChangeAllowed(
  target: TargetAccount,
  nextStatus: AccountStatus,
): void {
  if (target.actorId === target.targetId && nextStatus === "suspended") {
    throw new Error("You cannot suspend your own account.");
  }

  if (
    nextStatus === "suspended" &&
    target.targetRole === "admin" &&
    target.targetStatus === "active" &&
    target.activeAdminCount <= 1
  ) {
    throw new Error("At least one active administrator must remain.");
  }
}

export function assertRoleChangeAllowed(
  target: TargetAccount,
  nextRole: UserRole,
): void {
  if (target.actorId === target.targetId && nextRole !== "admin") {
    throw new Error("You cannot remove your own admin role.");
  }

  if (
    nextRole === "user" &&
    target.targetRole === "admin" &&
    target.targetStatus === "active" &&
    target.activeAdminCount <= 1
  ) {
    throw new Error("At least one active administrator must remain.");
  }
}
