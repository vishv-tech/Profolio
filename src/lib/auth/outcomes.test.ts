import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  authIssueMessage,
  classifyAuthError,
  resolveSignupProviderResult,
} from "@/lib/auth/outcomes";

test("classifies Supabase auth errors by safe code, status, and name", () => {
  assert.equal(
    classifyAuthError({ code: "email_not_confirmed", status: 400 }),
    "confirmation_required",
  );
  assert.equal(
    classifyAuthError({ code: "over_email_send_rate_limit", status: 429 }),
    "email_rate_limited",
  );
  assert.equal(classifyAuthError({ status: 429 }), "email_rate_limited");
  assert.equal(
    classifyAuthError({ code: "invalid_credentials" }),
    "invalid_credentials",
  );
  assert.equal(
    classifyAuthError({ code: "user_already_exists" }),
    "already_registered",
  );
  assert.equal(classifyAuthError({ code: "weak_password" }), "weak_password");
  assert.equal(
    classifyAuthError({ code: "email_address_invalid" }),
    "invalid_email",
  );
  assert.equal(
    classifyAuthError({ name: "AuthRetryableFetchError" }),
    "network_failure",
  );
});

test("does not classify or expose raw provider messages", () => {
  const raw = "SECRET provider stack trace: User already registered";

  assert.equal(classifyAuthError({ message: raw }), "unknown");
  assert.doesNotMatch(authIssueMessage("unknown", "signup"), /SECRET|stack/u);
});

test("distinguishes active-session and confirmation-required signup success", () => {
  assert.deepEqual(
    resolveSignupProviderResult({ session: { token: "opaque" }, user: {} }, null),
    { kind: "authenticated" },
  );
  assert.deepEqual(
    resolveSignupProviderResult({ session: null, user: { id: "opaque" } }, null),
    { kind: "confirmation_required" },
  );
});

test("distinguishes duplicate, weak-password, invalid-email, rate, and network failures", () => {
  for (const [error, issue] of [
    [{ code: "email_exists" }, "already_registered"],
    [{ name: "AuthWeakPasswordError" }, "weak_password"],
    [{ code: "email_address_invalid" }, "invalid_email"],
    [{ code: "over_request_rate_limit", status: 429 }, "email_rate_limited"],
    [{ status: 0 }, "network_failure"],
  ] as const) {
    assert.deepEqual(resolveSignupProviderResult(null, error), {
      kind: "error",
      issue,
    });
  }
});

test("signup, login, resend, and confirmation retain secure flow boundaries", () => {
  const actions = readFileSync("src/lib/auth/actions.ts", "utf8");
  const confirm = readFileSync("src/app/auth/confirm/route.ts", "utf8");
  const signupForm = readFileSync("src/components/auth/signup-form.tsx", "utf8");
  const loginForm = readFileSync("src/components/auth/login-form.tsx", "utf8");
  const resend = readFileSync("src/components/auth/resend-confirmation.tsx", "utf8");

  assert.match(actions, /emailRedirectTo: `\$\{origin\}\/auth\/confirm`/u);
  assert.match(actions, /supabase\.auth\.resend\(/u);
  assert.doesNotMatch(actions, /createAdminClient|SUPABASE_SECRET_KEY|getSession\(/u);
  assert.match(confirm, /exchangeCodeForSession\(code\)/u);
  assert.match(confirm, /verifyOtp\(/u);
  assert.match(confirm, /pathForUserRoleWithSafeNext/u);
  assert.doesNotMatch(confirm, /from\("profiles"\)\.insert/u);
  assert.match(signupForm, /disabled=\{pending\}/u);
  assert.match(loginForm, /disabled=\{pending\}/u);
  assert.match(resend, /Resend available in \$\{cooldown\}s/u);
  assert.match(resend, /disabled=\{pending \|\| cooldown > 0\}/u);
});
