import type { Tables } from "@/types/database";
import type { ThemeConfig } from "@/types/theme";

export type UserRole = "user" | "admin";
export type AccountStatus = "active" | "suspended";
export type ResumeStatus = "uploaded" | "processing" | "completed" | "failed";
export type PortfolioStatus = "draft" | "published" | "private";
export type DeploymentStatus = "current" | "historical" | "rolled_back";

type ProfileRow = Tables<"profiles">;
type ResumeRow = Tables<"resumes">;
type PortfolioRow = Tables<"portfolios">;
type ThemeRow = Tables<"themes">;
type DeploymentRow = Tables<"deployments">;

export type AdminProfile = Omit<ProfileRow, "role" | "account_status"> & {
  role: UserRole;
  account_status: AccountStatus;
};

export type AdminUser = AdminProfile & {
  email: string | null;
  portfolioCount: number;
};

export type AdminPortfolio = Pick<
  PortfolioRow,
  | "id"
  | "user_id"
  | "slug"
  | "title"
  | "theme_id"
  | "status"
  | "created_at"
  | "updated_at"
  | "published_at"
> & {
  status: PortfolioStatus;
  owner: Pick<AdminProfile, "full_name" | "username" | "avatar_url"> | null;
  theme: Pick<ThemeRow, "name" | "slug" | "layout_key"> | null;
  views: number;
};

export type AdminResume = Pick<
  ResumeRow,
  | "id"
  | "user_id"
  | "file_name"
  | "status"
  | "improve_with_ai"
  | "created_at"
  | "updated_at"
> & {
  status: ResumeStatus;
  owner: Pick<AdminProfile, "full_name" | "username" | "avatar_url"> | null;
};

export type AdminTheme = Omit<ThemeRow, "default_config"> & {
  default_config: ThemeConfig | null;
  portfolioCount: number;
};

export type AdminDeployment = Pick<
  DeploymentRow,
  | "id"
  | "portfolio_id"
  | "version"
  | "theme_id"
  | "status"
  | "created_at"
  | "published_by"
> & {
  status: DeploymentStatus;
  portfolio: Pick<PortfolioRow, "title" | "slug"> | null;
  owner: Pick<AdminProfile, "full_name" | "username" | "avatar_url"> | null;
  theme: Pick<ThemeRow, "name" | "slug" | "layout_key"> | null;
  publisher: Pick<AdminProfile, "full_name" | "username"> | null;
};

export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type DashboardMetrics = {
  activeThemes: number;
  completedResumes: number;
  publishedPortfolios: number;
  suspendedUsers: number;
  totalDeployments: number;
  totalPortfolios: number;
  totalResumes: number;
  totalUsers: number;
  totalViews: number;
};

export type TimeSeriesPoint = {
  day: string;
  value: number;
};

export type NamedMetric = {
  id: string;
  name: string;
  value: number;
};

export type AnalyticsData = {
  totalViews: number;
  viewsToday: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  viewsOverTime: TimeSeriesPoint[];
  userGrowth: TimeSeriesPoint[];
  portfolioGrowth: TimeSeriesPoint[];
  topPortfolios: NamedMetric[];
  themeUsage: NamedMetric[];
};

export type RecentActivity = {
  id: string;
  kind: "user" | "portfolio" | "resume" | "deployment";
  title: string;
  detail: string | null;
  occurredAt: string;
};

export type DashboardData = {
  analytics: AnalyticsData;
  metrics: DashboardMetrics;
  recentActivity: RecentActivity[];
  topPortfolios: AdminPortfolio[];
};
