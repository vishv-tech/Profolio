"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { resendConfirmation } from "@/lib/auth/actions";
import type { AuthActionState } from "@/lib/auth/validation";

const RESEND_COOLDOWN_SECONDS = 60;

const initialState: AuthActionState = {
  status: "idle",
  message: "",
};

export function ResendConfirmation({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(
    resendConfirmation,
    initialState,
  );
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timeout = window.setTimeout(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1_000,
    );

    return () => window.clearTimeout(timeout);
  }, [cooldown]);

  return (
    <div className="space-y-2">
      <form
        action={formAction}
        onSubmit={() => setCooldown(RESEND_COOLDOWN_SECONDS)}
      >
        <input name="email" type="hidden" value={email} />
        <Button
          disabled={pending || cooldown > 0}
          type="submit"
          variant="outline"
        >
          {pending ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <RefreshCw aria-hidden="true" />
          )}
          {pending
            ? "Sending…"
            : cooldown > 0
              ? `Resend available in ${cooldown}s`
              : "Resend confirmation email"}
        </Button>
      </form>
      {state.message ? (
        <p
          aria-live="polite"
          className={
            state.status === "error"
              ? "text-sm text-destructive"
              : "text-sm text-muted-foreground"
          }
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
