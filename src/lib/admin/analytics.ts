import "server-only";

import { requireAdmin } from "@/lib/admin/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AnalyticsData,
  DashboardMetrics,
  NamedMetric,
  TimeSeriesPoint,
} from "@/types/admin";

type AdminClient = ReturnType<typeof createAdminClient>;
type CreatedRow = { created_at: string };
type EventRow = CreatedRow & { portfolio_id: string };
type ThemeUsageRow = { theme_id: string | null };

const PAGE_SIZE = 1_000;

async function fetchEventsSince(
  client: AdminClient,
  since: string,
): Promise<EventRow[]> {
  const rows: EventRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from("portfolio_events")
      .select("portfolio_id, created_at")
      .eq("event_type", "view")
      .gte("created_at", since)
      .order("created_at")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error("Unable to load analytics events.");
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE_SIZE) break;
  }

  return rows;
}

async function fetchCreatedRows(
  client: AdminClient,
  table: "profiles" | "portfolios",
  since: string,
): Promise<CreatedRow[]> {
  const rows: CreatedRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from(table)
      .select("created_at")
      .gte("created_at", since)
      .order("created_at")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error("Unable to load growth analytics.");
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE_SIZE) break;
  }

  return rows;
}

async function fetchThemeUsageRows(
  client: AdminClient,
): Promise<ThemeUsageRow[]> {
  const rows: ThemeUsageRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from("portfolios")
      .select("theme_id")
      .not("theme_id", "is", null)
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error("Unable to load theme analytics.");
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE_SIZE) break;
  }

  return rows;
}

function startOfUtcDay(value = new Date()): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
}

function reportingStart(days: number): Date {
  const date = startOfUtcDay();
  date.setUTCDate(date.getUTCDate() - days + 1);
  return date;
}

function startOfUtcWeek(): Date {
  const date = startOfUtcDay();
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1));
  return date;
}

function startOfUtcMonth(): Date {
  const date = startOfUtcDay();
  date.setUTCDate(1);
  return date;
}

function dayKey(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

function timeSeries(days: number, rows: CreatedRow[]): TimeSeriesPoint[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const key = dayKey(row.created_at);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const start = reportingStart(days);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const day = dayKey(date);
    return { day, value: counts.get(day) ?? 0 };
  });
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  await requireAdmin();
  const client = createAdminClient();
  const [
    totalUsers,
    suspendedUsers,
    totalPortfolios,
    publishedPortfolios,
    totalResumes,
    completedResumes,
    totalDeployments,
    totalViews,
    activeThemes,
  ] = await Promise.all([
    client.from("profiles").select("id", { count: "exact", head: true }),
    client
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_status", "suspended"),
    client.from("portfolios").select("id", { count: "exact", head: true }),
    client
      .from("portfolios")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    client.from("resumes").select("id", { count: "exact", head: true }),
    client
      .from("resumes")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    client.from("deployments").select("id", { count: "exact", head: true }),
    client
      .from("portfolio_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "view"),
    client
      .from("themes")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
  ]);
  const results = [
    totalUsers,
    suspendedUsers,
    totalPortfolios,
    publishedPortfolios,
    totalResumes,
    completedResumes,
    totalDeployments,
    totalViews,
    activeThemes,
  ];

  if (results.some((result) => result.error)) {
    throw new Error("Unable to load dashboard metrics.");
  }

  return {
    totalUsers: totalUsers.count ?? 0,
    suspendedUsers: suspendedUsers.count ?? 0,
    totalPortfolios: totalPortfolios.count ?? 0,
    publishedPortfolios: publishedPortfolios.count ?? 0,
    totalResumes: totalResumes.count ?? 0,
    completedResumes: completedResumes.count ?? 0,
    totalDeployments: totalDeployments.count ?? 0,
    totalViews: totalViews.count ?? 0,
    activeThemes: activeThemes.count ?? 0,
  };
}

export async function getAnalytics(days = 30): Promise<AnalyticsData> {
  await requireAdmin();
  const safeDays = Math.min(Math.max(Math.trunc(days), 7), 365);
  const since = reportingStart(safeDays).toISOString();
  const client = createAdminClient();
  const [
    events,
    users,
    portfolios,
    themeUsageRows,
    themes,
    totalViews,
    viewsToday,
    viewsThisWeek,
    viewsThisMonth,
  ] = await Promise.all([
    fetchEventsSince(client, since),
    fetchCreatedRows(client, "profiles", since),
    fetchCreatedRows(client, "portfolios", since),
    fetchThemeUsageRows(client),
    client.from("themes").select("id, name"),
    client
      .from("portfolio_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "view"),
    client
      .from("portfolio_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "view")
      .gte("created_at", startOfUtcDay().toISOString()),
    client
      .from("portfolio_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "view")
      .gte("created_at", startOfUtcWeek().toISOString()),
    client
      .from("portfolio_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "view")
      .gte("created_at", startOfUtcMonth().toISOString()),
  ]);

  if (
    themes.error ||
    totalViews.error ||
    viewsToday.error ||
    viewsThisWeek.error ||
    viewsThisMonth.error
  ) {
    throw new Error("Unable to load analytics.");
  }

  const portfolioViews = new Map<string, number>();
  for (const event of events) {
    portfolioViews.set(
      event.portfolio_id,
      (portfolioViews.get(event.portfolio_id) ?? 0) + 1,
    );
  }

  const topIds = [...portfolioViews.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 10);
  let topPortfolios: NamedMetric[] = [];

  if (topIds.length) {
    const { data, error } = await client
      .from("portfolios")
      .select("id, title, slug")
      .in(
        "id",
        topIds.map(([id]) => id),
      );

    if (error) throw new Error("Unable to load top portfolios.");
    const names = new Map(
      (data ?? []).map((portfolio) => [
        portfolio.id,
        portfolio.title || portfolio.slug,
      ]),
    );
    topPortfolios = topIds.flatMap(([id, value]) => {
      const name = names.get(id);
      return name ? [{ id, name, value }] : [];
    });
  }

  const themeCounts = new Map<string, number>();
  for (const row of themeUsageRows) {
    if (row.theme_id) {
      themeCounts.set(row.theme_id, (themeCounts.get(row.theme_id) ?? 0) + 1);
    }
  }
  const themeNames = new Map(
    (themes.data ?? []).map((theme) => [theme.id, theme.name]),
  );
  const themeUsage = [...themeCounts.entries()]
    .map(([id, value]) => ({ id, name: themeNames.get(id) ?? "Unknown theme", value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 10);

  return {
    totalViews: totalViews.count ?? 0,
    viewsToday: viewsToday.count ?? 0,
    viewsThisWeek: viewsThisWeek.count ?? 0,
    viewsThisMonth: viewsThisMonth.count ?? 0,
    viewsOverTime: timeSeries(safeDays, events),
    userGrowth: timeSeries(safeDays, users),
    portfolioGrowth: timeSeries(safeDays, portfolios),
    topPortfolios,
    themeUsage,
  };
}
