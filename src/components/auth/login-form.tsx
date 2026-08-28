"use client";

import { LoaderCircle, LogIn } from "lucide-react";
import { useActionState } from "react";

import { FieldError } from "@/components/auth/field-error";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/auth/actions";
import type { AuthActionState } from "@/lib/auth/validation";

const initialState: AuthActionState = {
  status: "idle",
  message: "",
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          aria-describedby={
            state.fieldErrors?.email ? "login-email-error" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.email)}
          autoComplete="email"
          className="h-10"
          id="login-email"
          maxLength={254}
          name="email"
          required
          type="email"
        />
        <FieldError id="login-email-error" messages={state.fieldErrors?.email} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <PasswordInput
          aria-describedby={
            state.fieldErrors?.password ? "login-password-error" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.password)}
          autoComplete="current-password"
          id="login-password"
          maxLength={128}
          name="password"
          required
        />
        <FieldError
          id="login-password-error"
          messages={state.fieldErrors?.password}
        />
      </div>

      {state.message ? (
        <p
          aria-live="polite"
          className={
            state.status === "error"
              ? "rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              : "rounded-lg bg-muted px-3 py-2 text-sm"
          }
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <Button className="h-10 w-full" disabled={pending} type="submit">
        {pending ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" />
        ) : (
          <LogIn aria-hidden="true" />
        )}
        {pending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
