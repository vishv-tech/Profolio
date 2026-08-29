import "server-only";

import { getAnalytics, getDashboardMetrics } from "@/lib/admin/analytics";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AdminPortfolio,
  DashboardData,
  PortfolioStatus,
  RecentActivity,
} from "@/types/admin";

type Related<T> = T | T[] | null;

function relatedOne<T>(value: Related<T>): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function status(value: string): PortfolioStatus {
  if (value === "published" || value === "private") return value;
  return "draft";
}

export async function getRecentActivity(limit = 6): Promise<RecentActivity[]> {
  await requireAdmin();
  const client = createAdminClient();
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 20);
  const [users, portfolios, resumes, deployments] = await Promise.all([
    client
      .from("profiles")
      .select("id, full_name, username, created_at")
      .order("created_at", { ascending: false })
      .limit(safeLimit),
    client
      .from("portfolios")
      .select("id, title, slug, published_at")
      .eq("status", "published")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(safeLimit),
    client
      .from("resumes")
      .select("id, file_name, created_at")
      .order("created_at", { ascending: false })
      .limit(safeLimit),
    client
      .from("deployments")
      .select(
        "id, version, created_at, portfolio:portfolios!deployments_portfolio_id_fkey(title,slug)",
      )
      .order("created_at", { ascending: false })
      .limit(safeLimit),
  ]);

  if (users.error || portfolios.error || resumes.error || deployments.error) {
    throw new Error("Unable to load recent activity.");
  }

  const activity: RecentActivity[] = [
    ...(users.data ?? []).map((user) => ({
      id: `user-${user.id}`,
      kind: "user" as const,
      title: "User joined",
      detail: user.full_name || user.username,
      occurredAt: user.created_at,
    })),
    ...(portfolios.data ?? []).flatMap((portfolio) =>
      portfolio.published_at
        ? [
            {
              id: `portfolio-${portfolio.id}`,
              kind: "portfolio" as const,
              title: "Portfolio published",
              detail: portfolio.title || portfolio.slug,
              occurredAt: portfolio.published_at,
            },
          ]
        : [],
    ),
    ...(resumes.data ?? []).map((resume) => ({
      id: `resume-${resume.id}`,
      kind: "resume" as const,
      title: "Resume uploaded",
      detail: resume.file_name,
      occurredAt: resume.created_at,
    })),
    ...(deployments.data ?? []).map((deployment) => {
      const portfolio = relatedOne(deployment.portfolio);
      return {
        id: `deployment-${deployment.id}`,
        kind: "deployment" as const,
        title: `Deployment v${deployment.version} created`,
        detail: portfolio?.title || portfolio?.slug || null,
        occurredAt: deployment.created_at,
      };
    }),
  ];

  return activity
    .sort(
      (left, right) =>
        Date.parse(right.occurredAt) - Date.parse(left.occurredAt),
    )
    .slice(0, safeLimit);
}

export async function getTopPerformingPortfolios(
  idsWithViews: ReadonlyArray<{ id: string; value: number }>,
): Promise<AdminPortfolio[]> {
  await requireAdmin();
  if (!idsWithViews.length) return [];

  const client = createAdminClient();
  const { data, error } = await client
    .from("portfolios")
    .select(
      "id, user_id, slug, title, theme_id, status, created_at, updated_at, published_at, owner:profiles!portfolios_user_id_fkey(full_name,username,avatar_url), theme:themes!portfolios_theme_id_fkey(name,slug,layout_key)",
    )
    .in(
      "id",
      idsWithViews.map((portfolio) => portfolio.id),
    );

  if (error) throw new Error("Unable to load top portfolios.");

  const records = new Map((data ?? []).map((portfolio) => [portfolio.id, portfolio]));

  return idsWithViews.flatMap(({ id, value }) => {
    const portfolio = records.get(id);
    if (!portfolio) return [];

    return [
      {
        id: portfolio.id,
        user_id: portfolio.user_id,
        slug: portfolio.slug,
        title: portfolio.title,
        theme_id: portfolio.theme_id,
        status: status(portfolio.status),
        created_at: portfolio.created_at,
        updated_at: portfolio.updated_at,
        published_at: portfolio.published_at,
        owner: relatedOne(portfolio.owner),
        theme: relatedOne(portfolio.theme),
        views: value,
      },
    ];
  });
}

export async function getDashboardData(): Promise<DashboardData> {
  const [metrics, analytics, recentActivity] = await Promise.all([
    getDashboardMetrics(),
    getAnalytics(30),
    getRecentActivity(),
  ]);
  const topPortfolios = await getTopPerformingPortfolios(
    analytics.topPortfolios,
  );

  return { metrics, analytics, recentActivity, topPortfolios };
}
