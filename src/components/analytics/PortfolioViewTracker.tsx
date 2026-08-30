"use client";

import { useEffect } from "react";

import { claimSessionView } from "@/lib/analytics/core";

const trackedInMemory = new Set<string>();

export function PortfolioViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!claimSessionView(slug, window.sessionStorage, trackedInMemory)) return;

    void fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, referrer: document.referrer || null }),
      cache: "no-store",
      keepalive: true,
    }).catch(() => undefined);
  }, [slug]);

  return null;
}
