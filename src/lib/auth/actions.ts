"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { readAuthContext } from "@/lib/auth/guards";
import {
  authIssueMessage,
  classifyAuthError,
  resolveSignupProviderResult,
  type AuthIssueCode,
} from "@/lib/auth/outcomes";
import { pathForUserRole } from "@/lib/auth/redirects";
import {
  type AuthActionState,
  ConfirmationEmailSchema,
  LoginSchema,
  SignupSchema,
  toFieldErrors,
} from "@/lib/auth/validation";
import { getOptionalSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const CONFIGURATION_MESSAGE =
  "Authentication is not configured yet. Ask the project owner to finish the Supabase setup.";

function originFromVercelHostname(hostname: string | undefined) {
  const normalizedHostname = hostname?.trim().toLowerCase();

  if (
    !normalizedHostname ||
    normalizedHostname.includes("/") ||
    normalizedHostname.includes("\\") ||
    normalizedHostname.includes("@") ||
    normalizedHostname.includes(":")
  ) {
    return null;
  }

  try {
    const origin = new URL(`https://${normalizedHostname}`);

    return origin.hostname === normalizedHostname ? origin.origin : null;
  } catch {
    return null;
  }
}

function getApplicationOrigin() {
  return (
    originFromVercelHostname(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    originFromVercelHostname(process.env.VERCEL_URL) ??
    "http://localhost:3000"
  );
}

async function signOutCurrentSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  await supabase.auth.signOut({ scope: "local" });
}

function authErrorState(
  issue: AuthIssueCode,
  context: "login" | "resend" | "signup",
  email?: string,
): AuthActionState {
  return {
    status: "error",
    code: issue,
    message: authIssueMessage(issue, context),
    ...(email ? { email } : {}),
  };
}

export async function login(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (!getOptionalSupabasePublicEnv()) {
    return { status: "error", message: CONFIGURATION_MESSAGE };
  }

  const supabase = await createClient();
  let destination: string;

  try {
    const { error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      return authErrorState(
        classifyAuthError(error),
        "login",
        parsed.data.email,
      );
    }

    const result = await readAuthContext(supabase);

    if (result.status !== "authenticated") {
      await signOutCurrentSession(supabase);
      destination = "/auth/error?code=profile";
    } else if (result.context.profile.account_status === "suspended") {
      await signOutCurrentSession(supabase);
      destination = "/account-suspended";
    } else {
      destination = pathForUserRole(result.context.profile);
    }
  } catch (error) {
    return authErrorState(classifyAuthError(error), "login", parsed.data.email);
  }

  redirect(destination);
}

export async function signup(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = SignupSchema.safeParse({
    fullName: formData.get("fullName"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  if (!getOptionalSupabasePublicEnv()) {
    return { status: "error", message: CONFIGURATION_MESSAGE };
  }

  const supabase = await createClient();
  const { fullName, username, email, password } = parsed.data;
  const origin = getApplicationOrigin();
  let destination: string | null = null;
  let confirmationRequired = false;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/confirm`,
        data: {
          full_name: fullName,
          username,
        },
      },
    });

    const outcome = resolveSignupProviderResult(data, error);

    if (outcome.kind === "error") {
      if (outcome.issue === "email_rate_limited") {
        return {
          status: "success",
          code: outcome.issue,
          email,
          message:
            "Confirmation email delivery is temporarily limited. Your account may already be waiting for confirmation; wait, then resend the email below.",
        };
      }

      return authErrorState(outcome.issue, "signup", email);
    }

    if (outcome.kind === "confirmation_required") {
      confirmationRequired = true;
    } else {
      const result = await readAuthContext(supabase);

      if (result.status !== "authenticated") {
        await signOutCurrentSession(supabase);
        destination = "/auth/error?code=profile";
      } else {
        destination = pathForUserRole(result.context.profile);
      }
    }
  } catch (error) {
    return authErrorState(classifyAuthError(error), "signup", email);
  }

  if (confirmationRequired) {
    return {
      status: "success",
      code: "confirmation_required",
      email,
      message:
        "Account created. Check your email and use the confirmation link to finish setting up your account.",
    };
  }

  redirect(destination ?? "/auth/error?code=profile");
}

export async function resendConfirmation(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = ConfirmationEmailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return authErrorState("invalid_email", "resend");
  }

  if (!getOptionalSupabasePublicEnv()) {
    return { status: "error", message: CONFIGURATION_MESSAGE };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: parsed.data.email,
      options: {
        emailRedirectTo: `${getApplicationOrigin()}/auth/confirm`,
      },
    });

    if (error) {
      return authErrorState(
        classifyAuthError(error),
        "resend",
        parsed.data.email,
      );
    }

    return {
      status: "success",
      code: "confirmation_required",
      email: parsed.data.email,
      message: "Confirmation email sent. Check your inbox and spam folder.",
    };
  } catch (error) {
    return authErrorState(
      classifyAuthError(error),
      "resend",
      parsed.data.email,
    );
  }
}

export async function logout(): Promise<never> {
  if (getOptionalSupabasePublicEnv()) {
    const supabase = await createClient();
    await signOutCurrentSession(supabase);
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
