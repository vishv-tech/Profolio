import { notFound } from "next/navigation";

import { AnalyticsScreen } from "@/components/admin/analytics-screen";
import { DeploymentManagementScreen } from "@/components/admin/deployment-management-screen";
import { PortfolioManagementScreen } from "@/components/admin/portfolio-management-screen";
import { ResumeManagementScreen } from "@/components/admin/resume-management-screen";
import { ThemeManagementScreen } from "@/components/admin/theme-management-screen";
import { UserManagementScreen } from "@/components/admin/user-management-screen";
import { getAnalytics, getDashboardMetrics } from "@/lib/admin/analytics";
import { getTopPerformingPortfolios } from "@/lib/admin/dashboard";
import {
  getAdminDeploymentFilters,
  getAdminDeployments,
  getAdminDeploymentStats,
  getAdminPortfolioFilters,
  getAdminPortfolios,
  getAdminPortfolioStats,
  getAdminResumes,
  getAdminResumeStats,
  getAdminThemeRegistry,
  getAdminUsers,
  getAdminUserStats,
} from "@/lib/admin/queries";
import type {
  AccountStatus,
  DeploymentStatus,
  PortfolioStatus,
  ResumeStatus,
  UserRole,
} from "@/types/admin";

type Section =
  | "users"
  | "portfolios"
  | "resumes"
  | "themes"
  | "deployments"
  | "analytics";

function isSection(value: string): value is Section {
  return [
    "users",
    "portfolios",
    "resumes",
    "themes",
    "deployments",
    "analytics",
  ].includes(value);
}

function valueOf(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function uuid(value: string): string {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : "";
}

function userRole(value: string): UserRole | undefined {
  return value === "user" || value === "admin" ? value : undefined;
}

function accountStatus(value: string): AccountStatus | undefined {
  return value === "active" || value === "suspended" ? value : undefined;
}

function portfolioStatus(value: string): PortfolioStatus | undefined {
  return value === "draft" || value === "published" || value === "private"
    ? value
    : undefined;
}

function resumeStatus(value: string): ResumeStatus | undefined {
  return value === "uploaded" ||
    value === "processing" ||
    value === "completed" ||
    value === "failed"
    ? value
    : undefined;
}

function deploymentStatus(value: string): DeploymentStatus | undefined {
  return value === "current" || value === "historical" || value === "rolled_back"
    ? value
    : undefined;
}

function analyticsDays(value: string): 7 | 30 | 90 | 365 {
  if (value === "7") return 7;
  if (value === "90") return 90;
  if (value === "365") return 365;
  return 30;
}

function deploymentStart(value: "7" | "30" | "all"): string | undefined {
  if (value === "all") return undefined;
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - Number(value));
  return date.toISOString();
}

export default async function AdminSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const section = (await params).section;
  if (!isSection(section)) notFound();
  const raw = await searchParams;

  if (section === "users") {
    const query = {
      search: valueOf(raw.search),
      role: userRole(valueOf(raw.role)),
      accountStatus: accountStatus(valueOf(raw.status)),
      order: valueOf(raw.order) === "oldest" ? ("oldest" as const) : ("newest" as const),
    };
    const [users, stats] = await Promise.all([
      getAdminUsers({ ...query, page: valueOf(raw.page), pageSize: "10" }),
      getAdminUserStats(),
    ]);
    const success = valueOf(raw.success);
    const error = valueOf(raw.error);
    return <UserManagementScreen users={users} totalUsers={stats.totalUsers} administrators={stats.administrators} suspendedUsers={stats.suspendedUsers} query={query} message={success ? { kind: "success", text: success } : error ? { kind: "error", text: error } : undefined} />;
  }

  if (section === "portfolios") {
    const selectedStatus = portfolioStatus(valueOf(raw.status));
    const order = ["newest", "oldest", "title"].includes(valueOf(raw.order))
      ? (valueOf(raw.order) as "newest" | "oldest" | "title")
      : ("updated" as const);
    const query = { search: valueOf(raw.search), status: selectedStatus ?? ("all" as const), themeId: uuid(valueOf(raw.themeId)), ownerId: uuid(valueOf(raw.ownerId)), order };
    const [portfolios, stats, filters] = await Promise.all([
      getAdminPortfolios({ search: query.search, status: selectedStatus, themeId: query.themeId || undefined, ownerId: query.ownerId || undefined, order: query.order, page: valueOf(raw.page), pageSize: "10" }),
      getAdminPortfolioStats(),
      getAdminPortfolioFilters(),
    ]);
    return <PortfolioManagementScreen portfolios={portfolios} stats={stats} filters={filters} query={query} />;
  }

  if (section === "resumes") {
    const selectedStatus = resumeStatus(valueOf(raw.status));
    const ai = valueOf(raw.ai) === "yes" || valueOf(raw.ai) === "no" ? valueOf(raw.ai) as "yes" | "no" : "all" as const;
    const order = valueOf(raw.order) === "oldest" || valueOf(raw.order) === "updated" ? valueOf(raw.order) as "oldest" | "updated" : "newest" as const;
    const query = { search: valueOf(raw.search), status: selectedStatus ?? "all" as const, ai, ownerId: uuid(valueOf(raw.ownerId)), order };
    const [resumes, stats, filters] = await Promise.all([
      getAdminResumes({ search: query.search, status: selectedStatus, improveWithAi: ai === "all" ? undefined : ai === "yes", ownerId: query.ownerId || undefined, order, page: valueOf(raw.page), pageSize: "10" }),
      getAdminResumeStats(),
      getAdminPortfolioFilters(),
    ]);
    return <ResumeManagementScreen resumes={resumes} stats={stats} owners={filters.owners} query={query} />;
  }

  if (section === "themes") {
    const status = valueOf(raw.status) === "active" || valueOf(raw.status) === "inactive" ? valueOf(raw.status) as "active" | "inactive" : "all" as const;
    const order = valueOf(raw.order) === "name" ? "name" as const : "registry" as const;
    const query = { search: valueOf(raw.search), status, order };
    const registry = await getAdminThemeRegistry();
    const success = valueOf(raw.success);
    const error = valueOf(raw.error);
    return <ThemeManagementScreen registry={registry} query={query} message={success ? { kind: "success", text: success } : error ? { kind: "error", text: error } : undefined} />;
  }

  if (section === "deployments") {
    const selectedStatus = deploymentStatus(valueOf(raw.status));
    const dateRange = valueOf(raw.date) === "7" || valueOf(raw.date) === "all" ? valueOf(raw.date) as "7" | "all" : "30" as const;
    const order = valueOf(raw.order) === "oldest" ? "oldest" as const : "newest" as const;
    const query = { search: valueOf(raw.search), status: selectedStatus ?? "all" as const, portfolioId: uuid(valueOf(raw.portfolioId)), dateRange, order };
    const [deployments, stats, filters] = await Promise.all([
      getAdminDeployments({ search: query.search, status: selectedStatus, portfolioId: query.portfolioId || undefined, createdAfter: deploymentStart(dateRange), order, page: valueOf(raw.page), pageSize: "10" }),
      getAdminDeploymentStats(),
      getAdminDeploymentFilters(),
    ]);
    return <DeploymentManagementScreen deployments={deployments} stats={stats} filters={filters} query={query} selectedDeploymentId={uuid(valueOf(raw.deployment))} />;
  }

  const days = analyticsDays(valueOf(raw.days));
  const [analytics, metrics] = await Promise.all([getAnalytics(days), getDashboardMetrics()]);
  const portfolios = await getTopPerformingPortfolios(analytics.topPortfolios);
  return <AnalyticsScreen analytics={analytics} metrics={metrics} portfolios={portfolios} days={days} />;
}
