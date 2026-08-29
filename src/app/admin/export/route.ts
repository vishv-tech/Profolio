import { getAnalytics, getDashboardMetrics } from "@/lib/admin/analytics";
import { getDashboardData } from "@/lib/admin/dashboard";
import { requireAdmin } from "@/lib/admin/require-admin";

function csvCell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function analyticsDays(value: string | null): 7 | 30 | 90 | 365 {
  if (value === "7") return 7;
  if (value === "90") return 90;
  if (value === "365") return 365;
  return 30;
}

function csvResponse(rows: Array<Array<string | number>>, filename: string) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);

  if (url.searchParams.get("scope") === "analytics") {
    const days = analyticsDays(url.searchParams.get("days"));
    const [analytics, metrics] = await Promise.all([
      getAnalytics(days),
      getDashboardMetrics(),
    ]);
    return csvResponse(
      [
        ["Metric", "Value"],
        ["Reporting period (days)", days],
        ["Total portfolio views", analytics.totalViews],
        ["Views today", analytics.viewsToday],
        ["Views this week", analytics.viewsThisWeek],
        ["Views this month", analytics.viewsThisMonth],
        ["Published portfolios", metrics.publishedPortfolios],
        ["Total portfolios", metrics.totalPortfolios],
        [],
        ["Portfolio", "Views in period"],
        ...analytics.topPortfolios.map((portfolio) => [
          portfolio.name,
          portfolio.value,
        ]),
      ],
      `admin-analytics-last-${days}-days.csv`,
    );
  }

  const data = await getDashboardData();
  return csvResponse(
    [
      ["Metric", "Value"],
      ["Total users", data.metrics.totalUsers],
      ["Suspended users", data.metrics.suspendedUsers],
      ["Total portfolios", data.metrics.totalPortfolios],
      ["Published portfolios", data.metrics.publishedPortfolios],
      ["Total resumes", data.metrics.totalResumes],
      ["Completed resumes", data.metrics.completedResumes],
      ["Total deployments", data.metrics.totalDeployments],
      ["Portfolio views", data.metrics.totalViews],
      ["Active themes", data.metrics.activeThemes],
    ],
    "admin-dashboard-report.csv",
  );
}
