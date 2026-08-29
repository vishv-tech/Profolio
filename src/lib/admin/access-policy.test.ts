import assert from "node:assert/strict";
import test from "node:test";

import { decideAdminAccess } from "./access-policy";

test("anonymous visitors are rejected", () => {
  assert.deepEqual(decideAdminAccess({ status: "anonymous" }), {
    allowed: false,
    destination: "/login?next=/admin",
  });
});

test("normal active users are rejected", () => {
  assert.deepEqual(
    decideAdminAccess({
      status: "authenticated",
      role: "user",
      accountStatus: "active",
    }),
    { allowed: false, destination: "/forbidden" },
  );
});

test("active administrators are accepted", () => {
  assert.deepEqual(
    decideAdminAccess({
      status: "authenticated",
      role: "admin",
      accountStatus: "active",
    }),
    { allowed: true },
  );
});

test("suspended administrators are rejected", () => {
  assert.deepEqual(
    decideAdminAccess({
      status: "authenticated",
      role: "admin",
      accountStatus: "suspended",
    }),
    { allowed: false, destination: "/account-suspended" },
  );
});
