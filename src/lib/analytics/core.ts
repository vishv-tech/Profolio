import { z } from "zod";

import { PortfolioIdSchema, PortfolioSlugSchema } from "@/lib/portfolios/contracts";

export const ANALYTICS_RANGES = [7, 30] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export const PortfolioViewRequestSchema = z.strictObject({
  slug: PortfolioSlugSchema,
  referrer: z.string().max(2048).nullable().optional(),
});

export type PortfolioViewEvent = {
  portfolio_id: string;
  event_type: "view";
  referrer: "Direct" | "Google" | "LinkedIn" | "GitHub" | "Other";
};

export type ViewTimestamp = { createdAt: string };
export type DailyViews = { date: string; views: number };

export function resolveAnalyticsRange(value: unknown): AnalyticsRange {
  return value === "7" ? 7 : 30;
}

export function normalizeReferrer(
  value: string | null | undefined,
): PortfolioViewEvent["referrer"] {
  if (!value?.trim()) return "Direct";

  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
    if (hostname === "linkedin.com" || hostname.endsWith(".linkedin.com")) return "LinkedIn";
    if (hostname === "github.com" || hostname.endsWith(".github.com")) return "GitHub";
    if (hostname === "google.com" || hostname.startsWith("google.")) return "Google";
  } catch {
    return "Other";
  }

  return "Other";
}

export function buildPortfolioViewEvent(
  portfolioId: string,
  referrer?: string | null,
): PortfolioViewEvent | null {
  const parsedId = PortfolioIdSchema.safeParse(portfolioId);
  if (!parsedId.success) return null;

  return {
    portfolio_id: parsedId.data,
    event_type: "view",
    referrer: normalizeReferrer(referrer),
  };
}

export function utcDayStart(now: Date, daysAgo = 0): Date {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - daysAgo);
  return start;
}

export function aggregateViewEvents(
  events: readonly ViewTimestamp[],
  now: Date,
  range: AnalyticsRange = 30,
) {
  const nowTime = now.getTime();
  const validTimes = events.flatMap(({ createdAt }) => {
    const time = Date.parse(createdAt);
    return Number.isFinite(time) && time <= nowTime ? [time] : [];
  });
  const todayStart = utcDayStart(now).getTime();
  const sevenDayStart = utcDayStart(now, 6).getTime();
  const thirtyDayStart = utcDayStart(now, 29).getTime();
  const trendStart = utcDayStart(now, range - 1);
  const dailyCounts = new Map<string, number>();

  for (const time of validTimes) {
    if (time >= trendStart.getTime()) {
      const key = new Date(time).toISOString().slice(0, 10);
      dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
    }
  }

  const daily: DailyViews[] = Array.from({ length: range }, (_, index) => {
    const date = new Date(trendStart);
    date.setUTCDate(date.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    return { date: key, views: dailyCounts.get(key) ?? 0 };
  });

  return {
    total: validTimes.length,
    today: validTimes.filter((time) => time >= todayStart).length,
    last7Days: validTimes.filter((time) => time >= sevenDayStart).length,
    last30Days: validTimes.filter((time) => time >= thirtyDayStart).length,
    daily,
  };
}

type SessionStorage = Pick<Storage, "getItem" | "setItem">;

export function claimSessionView(
  slug: string,
  storage: SessionStorage,
  memory: Set<string>,
): boolean {
  const parsedSlug = PortfolioSlugSchema.safeParse(slug);
  if (!parsedSlug.success) return false;

  const key = `profolio:portfolio-view:${parsedSlug.data}`;
  if (memory.has(key)) return false;

  try {
    if (storage.getItem(key)) {
      memory.add(key);
      return false;
    }
    storage.setItem(key, "1");
  } catch {
    // In-memory dedupe still covers strict-mode remounts when storage is blocked.
  }

  memory.add(key);
  return true;
}
