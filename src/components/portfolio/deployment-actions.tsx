"use client";

import { Check, Clipboard, ExternalLink } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { Button, buttonVariants } from "@/components/ui/button";

const subscribeToOrigin = () => () => undefined;

export function DeploymentActions({ publicPath }: { publicPath: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const origin = useSyncExternalStore(
    subscribeToOrigin,
    () => window.location.origin,
    () => "",
  );
  const displayUrl = origin
    ? new URL(publicPath, origin).toString()
    : publicPath;

  async function copyPublicUrl() {
    try {
      const absoluteUrl = new URL(publicPath, window.location.origin).toString();
      await navigator.clipboard.writeText(absoluteUrl);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex min-w-0 items-center rounded-lg border bg-muted/40 px-3 py-2">
        <code className="min-w-0 flex-1 truncate text-xs sm:text-sm">
          {displayUrl}
        </code>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={copyPublicUrl} type="button" variant="outline">
          {copyState === "copied" ? (
            <Check aria-hidden="true" />
          ) : (
            <Clipboard aria-hidden="true" />
          )}
          {copyState === "copied" ? "Copied" : "Copy Link"}
        </Button>
        <a
          className={buttonVariants()}
          href={publicPath}
          rel="noopener noreferrer"
          target="_blank"
        >
          Open Portfolio
          <ExternalLink aria-hidden="true" />
        </a>
      </div>
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {copyState === "failed"
          ? "The link could not be copied. Select the URL above and copy it manually."
          : copyState === "copied"
            ? "Public portfolio link copied to the clipboard."
            : "Opening the public portfolio keeps this workspace available."}
      </p>
    </div>
  );
}
