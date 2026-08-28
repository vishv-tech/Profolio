"use client";

import { LoaderCircle, MailCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { FieldError } from "@/components/auth/field-error";
import { PasswordInput } from "@/components/auth/password-input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from "@/lib/auth/actions";
import type { AuthActionState } from "@/lib/auth/validation";

const initialState: AuthActionState = {
  status: "idle",
  message: "",
};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  if (state.status === "success") {
    return (
      <div className="space-y-5 text-center" role="status">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <MailCheck aria-hidden="true" className="size-5" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Check your email</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {state.message}
          </p>
        </div>
        <Link
          className={buttonVariants({ variant: "outline", size: "lg" })}
          href="/login"
        >
          Return to login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="signup-full-name">Full name</Label>
          <Input
            aria-describedby={
              state.fieldErrors?.fullName
                ? "signup-full-name-error"
                : undefined
            }
            aria-invalid={Boolean(state.fieldErrors?.fullName)}
            autoComplete="name"
            className="h-10"
            id="signup-full-name"
            maxLength={100}
            name="fullName"
            required
          />
          <FieldError
            id="signup-full-name-error"
            messages={state.fieldErrors?.fullName}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-username">Username</Label>
          <Input
            aria-describedby={
              state.fieldErrors?.username
                ? "signup-username-error"
                : "signup-username-hint"
            }
            aria-invalid={Boolean(state.fieldErrors?.username)}
            autoCapitalize="none"
            autoComplete="username"
            className="h-10"
            id="signup-username"
            maxLength={30}
            minLength={3}
            name="username"
            required
            spellCheck={false}
          />
          <p className="text-xs text-muted-foreground" id="signup-username-hint">
            Lowercase letters, numbers, and underscores.
          </p>
          <FieldError
            id="signup-username-error"
            messages={state.fieldErrors?.username}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          aria-describedby={
            state.fieldErrors?.email ? "signup-email-error" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.email)}
          autoComplete="email"
          className="h-10"
          id="signup-email"
          maxLength={254}
          name="email"
          required
          type="email"
        />
        <FieldError
          id="signup-email-error"
          messages={state.fieldErrors?.email}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <PasswordInput
            aria-describedby={
              state.fieldErrors?.password
                ? "signup-password-error"
                : "signup-password-hint"
            }
            aria-invalid={Boolean(state.fieldErrors?.password)}
            autoComplete="new-password"
            id="signup-password"
            maxLength={128}
            minLength={8}
            name="password"
            required
          />
          <p className="text-xs text-muted-foreground" id="signup-password-hint">
            Use at least 8 characters.
          </p>
          <FieldError
            id="signup-password-error"
            messages={state.fieldErrors?.password}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-confirm-password">Confirm password</Label>
          <PasswordInput
            aria-describedby={
              state.fieldErrors?.confirmPassword
                ? "signup-confirm-password-error"
                : undefined
            }
            aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
            autoComplete="new-password"
            id="signup-confirm-password"
            maxLength={128}
            name="confirmPassword"
            required
          />
          <FieldError
            id="signup-confirm-password-error"
            messages={state.fieldErrors?.confirmPassword}
          />
        </div>
      </div>

      {state.message ? (
        <p
          aria-live="polite"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <Button className="h-10 w-full" disabled={pending} type="submit">
        {pending ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" />
        ) : (
          <UserPlus aria-hidden="true" />
        )}
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
