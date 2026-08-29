import assert from "node:assert/strict";
import test from "node:test";

import {
  assertAccountStatusChangeAllowed,
  assertRoleChangeAllowed,
} from "./mutation-policy";

const activeAdmin = {
  actorId: "00000000-0000-4000-8000-000000000001",
  targetId: "00000000-0000-4000-8000-000000000002",
  targetRole: "admin" as const,
  targetStatus: "active" as const,
  activeAdminCount: 2,
};

test("an administrator cannot suspend their own account", () => {
  assert.throws(
    () =>
      assertAccountStatusChangeAllowed(
        { ...activeAdmin, targetId: activeAdmin.actorId },
        "suspended",
      ),
    /cannot suspend your own account/,
  );
});

test("the final active administrator cannot be suspended", () => {
  assert.throws(
    () =>
      assertAccountStatusChangeAllowed(
        { ...activeAdmin, activeAdminCount: 1 },
        "suspended",
      ),
    /At least one active administrator must remain/,
  );
});

test("an administrator cannot remove their own role", () => {
  assert.throws(
    () =>
      assertRoleChangeAllowed(
        { ...activeAdmin, targetId: activeAdmin.actorId },
        "user",
      ),
    /cannot remove your own admin role/,
  );
});

test("the final active administrator cannot be demoted", () => {
  assert.throws(
    () =>
      assertRoleChangeAllowed(
        { ...activeAdmin, activeAdminCount: 1 },
        "user",
      ),
    /At least one active administrator must remain/,
  );
});

test("a non-final administrator can be demoted", () => {
  assert.doesNotThrow(() => assertRoleChangeAllowed(activeAdmin, "user"));
});
