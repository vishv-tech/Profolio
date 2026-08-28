"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { readAuthContext } from "@/lib/auth/guards";
import { pathForUserRole } from "@/lib/auth/redirects";
import {
  type AuthActionState,
  LoginSchema,
  SignupSchema,
  toFieldErrors,
} from "@/lib/auth/validation";
import { getOptionalSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const CONFIGURATION_MESSAGE =
  "Authentication is not configured yet. Ask the project owner to finish the Supabase setup.";

async function signOutCurrentSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  await supabase.auth.signOut({ scope: "local" });
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
      return {
        status: "error",
        message: "Invalid email or password.",
      };
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
  } catch {
    return {
      status: "error",
      message: "Unable to log in right now. Please try again.",
    };
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
  let destination: string | null = null;
  let confirmationRequired = false;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username,
        },
      },
    });

    if (error) {
      return {
        status: "error",
        message:
          "Unable to create that account. The email or username may already be in use.",
      };
    }

    if (!data.session) {
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
  } catch {
    return {
      status: "error",
      message: "Unable to create your account right now. Please try again.",
    };
  }

  if (confirmationRequired) {
    return {
      status: "success",
      message:
        "Check your email and use the confirmation link to finish creating your account.",
    };
  }

  redirect(destination ?? "/auth/error?code=profile");
}

export async function logout(): Promise<never> {
  if (getOptionalSupabasePublicEnv()) {
    const supabase = await createClient();
    await signOutCurrentSession(supabase);
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
