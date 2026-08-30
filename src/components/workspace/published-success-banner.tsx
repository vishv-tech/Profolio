"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

export function PublishedSuccessBanner({ version }: { version?: number }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("published");
    window.history.replaceState(window.history.state, "", url);
  }, []);

  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950"
      role="status"
    >
      <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-semibold">Portfolio published successfully.</p>
        <p className="mt-1 text-sm leading-6">
          {version
            ? `Version ${version} is ready to share.`
            : "Your published portfolio is ready to share."}
        </p>
      </div>
    </div>
  );
}
