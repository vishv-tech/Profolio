"use client";

import { FilePenLine, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { createManualPortfolio } from "@/lib/portfolios/manual-actions";

export function ManualPortfolioButton({
  className,
  size,
  variant = "outline",
}: {
  className?: string;
  size?: "default" | "lg";
  variant?: "default" | "outline";
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startCreating] = useTransition();

  function create() {
    if (pending) return;

    setMessage(null);
    startCreating(async () => {
      try {
        const result = await createManualPortfolio();

        if (!result.success) {
          setMessage(result.message);
          return;
        }

        router.push(
          `/dashboard/editor?portfolio=${encodeURIComponent(result.portfolioId)}`,
        );
        router.refresh();
      } catch {
        setMessage("The portfolio could not be created. Please try again.");
      }
    });
  }

  return (
    <div className={className}>
      <Button
        disabled={pending}
        onClick={create}
        size={size}
        type="button"
        variant={variant}
      >
        {pending ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" />
        ) : (
          <FilePenLine aria-hidden="true" />
        )}
        {pending ? "Creating portfolio…" : "Create Portfolio Manually"}
      </Button>
      {message ? (
        <p
          aria-live="polite"
          className="mt-2 text-sm text-destructive"
          role="alert"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
