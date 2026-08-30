import "server-only";

import { z } from "zod";

import {
  aggregateViewEvents,
  type AnalyticsRange,
  normalizeReferrer,
  utcDayStart,
} from "@/lib/analytics/core";
import { PortfolioIdSchema } from "@/lib/portfolios/contracts";
import { createClient } from "@/lib/supabase/server";

const PortfolioChoiceSchema = z.strictObject({
  id: z.string().uuid(),
  title: z.string().min(1),
  slug: z.string(),
  status: z.enum(["draft", "published", "private"]),
});

const EventSchema = z.strictObject({
  created_at: z.string(),
  referrer: z.string().nullable(),
});

export type AnalyticsPortfolio = z.infer<typeof PortfolioChoiceSchema>;

export type PortfolioAnalyticsResult =
  | { status: "empty" }
  | { status: "unavailable"; portfolios: AnalyticsPortfolio[] }
  | { status: "error"; portfolios: AnalyticsPortfolio[] }
  | {
      status: "ready";
      portfolios: AnalyticsPortfolio[];
      portfolio: AnalyticsPortfolio;
      metrics: {
        total: number;
        today: number;
        last7Days: number;
        last30Days: number;
      };
      daily: ReturnType<typeof aggregateViewEvents>["daily"];
      recent: Array<{
        createdAt: string;
        referrer: ReturnType<typeof normalizeReferrer>;
      }>;
    };

export async function getOwnedPortfolioAnalytics(
  userId: string,
  requestedPortfolioId: string | null,
  range: AnalyticsRange,
  now = new Date(),
): Promise<PortfolioAnalyticsResult> {
  const supabase = await createClient();
  const portfolioResult = await supabase
    .from("portfolios")
    .select("id, title, slug, status")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (portfolioResult.error) return { status: "error", portfolios: [] };

  const portfolios = (portfolioResult.data ?? []).flatMap((row) => {
    const parsed = PortfolioChoiceSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
  if (portfolios.length === 0) return { status: "empty" };

  const selectedId = requestedPortfolioId
    ? PortfolioIdSchema.safeParse(requestedPortfolioId)
    : null;
  const portfolio = requestedPortfolioId
    ? selectedId?.success
      ? portfolios.find(({ id }) => id === selectedId.data)
      : undefined
    : portfolios[0];
  if (!portfolio) return { status: "unavailable", portfolios };

  const today = utcDayStart(now).toISOString();
  const last7Days = utcDayStart(now, 6).toISOString();
  const last30Days = utcDayStart(now, 29).toISOString();
  const trendStart = utcDayStart(now, range - 1).toISOString();
  const baseCount = () =>
    supabase
      .from("portfolio_events")
      .select("id", { count: "exact", head: true })
      .eq("portfolio_id", portfolio.id)
      .eq("event_type", "view");

  const [total, todayCount, sevenDayCount, thirtyDayCount, trend, recent] =
    await Promise.all([
      baseCount(),
      baseCount().gte("created_at", today),
      baseCount().gte("created_at", last7Days),
      baseCount().gte("created_at", last30Days),
      supabase
        .from("portfolio_events")
        .select("created_at, referrer")
        .eq("portfolio_id", portfolio.id)
        .eq("event_type", "view")
        .gte("created_at", trendStart)
        .order("created_at", { ascending: true }),
      supabase
        .from("portfolio_events")
        .select("created_at, referrer")
        .eq("portfolio_id", portfolio.id)
        .eq("event_type", "view")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  if (
    total.error ||
    todayCount.error ||
    sevenDayCount.error ||
    thirtyDayCount.error ||
    trend.error ||
    recent.error
  ) {
    return { status: "error", portfolios };
  }

  const trendEvents = (trend.data ?? []).flatMap((row) => {
    const parsed = EventSchema.safeParse(row);
    return parsed.success ? [{ createdAt: parsed.data.created_at }] : [];
  });
  // ponytail: group the bounded 7/30-day window in-process; add a SQL RPC if traffic outgrows PostgREST's row limit.
  const summary = aggregateViewEvents(trendEvents, now, range);

  return {
    status: "ready",
    portfolios,
    portfolio,
    metrics: {
      total: total.count ?? 0,
      today: todayCount.count ?? 0,
      last7Days: sevenDayCount.count ?? 0,
      last30Days: thirtyDayCount.count ?? 0,
    },
    daily: summary.daily,
    recent: (recent.data ?? []).flatMap((row) => {
      const parsed = EventSchema.safeParse(row);
      return parsed.success
        ? [{ createdAt: parsed.data.created_at, referrer: normalizeStoredReferrer(parsed.data.referrer) }]
        : [];
    }),
  };
}

function normalizeStoredReferrer(value: string | null) {
  if (
    value === "Direct" ||
    value === "Google" ||
    value === "LinkedIn" ||
    value === "GitHub" ||
    value === "Other"
  ) {
    return value;
  }
  return normalizeReferrer(value);
}
