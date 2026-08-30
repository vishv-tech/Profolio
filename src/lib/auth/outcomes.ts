export type AuthIssueCode =
  | "already_registered"
  | "confirmation_required"
  | "email_rate_limited"
  | "invalid_credentials"
  | "invalid_email"
  | "network_failure"
  | "unknown"
  | "weak_password";

type AuthErrorShape = {
  code?: unknown;
  name?: unknown;
  status?: unknown;
};

function errorShape(error: unknown): AuthErrorShape {
  return typeof error === "object" && error !== null ? error : {};
}

export function classifyAuthError(error: unknown): AuthIssueCode {
  const { code, name, status } = errorShape(error);

  if (
    status === 429 ||
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit"
  ) {
    return "email_rate_limited";
  }

  if (code === "email_not_confirmed") {
    return "confirmation_required";
  }

  if (code === "invalid_credentials") {
    return "invalid_credentials";
  }

  if (
    code === "email_exists" ||
    code === "identity_already_exists" ||
    code === "user_already_exists"
  ) {
    return "already_registered";
  }

  if (code === "weak_password" || name === "AuthWeakPasswordError") {
    return "weak_password";
  }

  if (
    code === "email_address_invalid" ||
    code === "email_address_not_authorized"
  ) {
    return "invalid_email";
  }

  if (
    status === 0 ||
    code === "request_timeout" ||
    name === "AuthRetryableFetchError"
  ) {
    return "network_failure";
  }

  return "unknown";
}

export type SignupProviderResult =
  | { kind: "authenticated" }
  | { kind: "confirmation_required" }
  | { kind: "error"; issue: AuthIssueCode };

export function resolveSignupProviderResult(
  data: { session?: unknown; user?: unknown } | null,
  error: unknown,
): SignupProviderResult {
  if (error) {
    return { kind: "error", issue: classifyAuthError(error) };
  }

  if (data?.session) {
    return { kind: "authenticated" };
  }

  if (data?.user) {
    return { kind: "confirmation_required" };
  }

  return { kind: "error", issue: "unknown" };
}

export function authIssueMessage(
  issue: AuthIssueCode,
  context: "login" | "resend" | "signup",
): string {
  switch (issue) {
    case "confirmation_required":
      return "Confirm your email before logging in. You can resend the confirmation below.";
    case "email_rate_limited":
      return "Too many confirmation emails were requested. Please wait a moment before trying again.";
    case "invalid_credentials":
      return "Invalid email or password.";
    case "already_registered":
      return "An account may already exist for this email. Try logging in or resend confirmation if needed.";
    case "weak_password":
      return "Choose a stronger password and try again.";
    case "invalid_email":
      return "Enter a valid email address.";
    case "network_failure":
      return `Unable to ${context === "login" ? "log in" : context === "resend" ? "resend the email" : "create your account"} because the authentication service could not be reached. Please try again.`;
    default:
      return context === "login"
        ? "Unable to log in right now. Please try again."
        : context === "resend"
          ? "The confirmation email could not be sent. Please try again later."
          : "Unable to create your account right now. Please try again.";
  }
}
