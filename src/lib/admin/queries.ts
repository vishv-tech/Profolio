import "server-only";

import { pagination, safeSearch } from "@/lib/admin/pagination";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildCodedThemeRegistryEntries,
  type CodedThemeRegistryEntry,
  type ThemeMetadataRow,
} from "@/lib/themes/metadata";
import { ThemeConfigSchema } from "@/lib/validation/theme";
import type { Tables } from "@/types/database";
import type {
  AccountStatus,
  AdminDeployment,
  AdminPortfolio,
  AdminProfile,
  AdminResume,
  AdminTheme,
  AdminUser,
  DeploymentStatus,
  PageResult,
  PortfolioStatus,
  ResumeStatus,
  UserRole,
} from "@/types/admin";

type ProfileRow = Tables<"profiles">;
type ThemeRow = Tables<"themes">;
type Related<T> = T | T[] | null;

function relatedOne<T>(value: Related<T>): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function userRole(value: string): UserRole {
  return value === "admin" ? "admin" : "user";
}

function accountStatus(value: string): AccountStatus {
  return value === "suspended" ? "suspended" : "active";
}

function portfolioStatus(value: string): PortfolioStatus {
  if (value === "published" || value === "private") return value;
  return "draft";
}

function resumeStatus(value: string): ResumeStatus {
  if (
    value === "processing" ||
    value === "completed" ||
    value === "failed"
  ) {
    return value;
  }
  return "uploaded";
}

function deploymentStatus(value: string): DeploymentStatus {
  if (value === "historical" || value === "rolled_back") return value;
  return "current";
}

function adminProfile(row: ProfileRow): AdminProfile {
  return {
    ...row,
    role: userRole(row.role),
    account_status: accountStatus(row.account_status),
  };
}

type PageOptions = {
  page?: string;
  pageSize?: string;
  search?: string;
};

export type UserOptions = PageOptions & {
  role?: UserRole;
  accountStatus?: AccountStatus;
  order?: "newest" | "oldest";
};

export type PortfolioOptions = PageOptions & {
  status?: PortfolioStatus;
  themeId?: string;
  ownerId?: string;
  order?: "updated" | "newest" | "oldest" | "title";
};

export type ResumeOptions = PageOptions & {
  status?: ResumeStatus;
  improveWithAi?: boolean;
  ownerId?: string;
  order?: "newest" | "oldest" | "updated";
};

export type ThemeOptions = PageOptions & {
  isActive?: boolean;
  order?: "updated" | "newest" | "name";
};

export type DeploymentOptions = PageOptions & {
  status?: DeploymentStatus;
  portfolioId?: string;
  createdAfter?: string;
  order?: "newest" | "oldest";
};

export async function getAdminUserStats() {
  await requireAdmin();
  const client = createAdminClient();
  const [totalUsers, administrators, suspendedUsers] = await Promise.all([
    client.from("profiles").select("id", { count: "exact", head: true }),
    client
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin"),
    client
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_status", "suspended"),
  ]);

  if (totalUsers.error || administrators.error || suspendedUsers.error) {
    throw new Error("Unable to load user statistics.");
  }

  return {
    totalUsers: totalUsers.count ?? 0,
    administrators: administrators.count ?? 0,
    suspendedUsers: suspendedUsers.count ?? 0,
  };
}

export async function getAdminUsers(
  options: UserOptions,
): Promise<PageResult<AdminUser>> {
  await requireAdmin();
  const { page, pageSize, from, to } = pagination(
    options.page,
    options.pageSize,
  );
  const search = safeSearch(options.search);
  const client = createAdminClient();
  let query = client
    .from("profiles")
    .select(
      "id, username, full_name, avatar_url, role, account_status, created_at, updated_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: options.order === "oldest" })
    .range(from, to);

  if (options.role) query = query.eq("role", options.role);
  if (options.accountStatus) {
    query = query.eq("account_status", options.accountStatus);
  }
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,username.ilike.%${search}%`,
    );
  }

  const { data, count, error } = await query;

  if (error) throw new Error("Unable to load users.");

  const rows = data ?? [];
  const ids = rows.map((row) => row.id);
  const portfolioCounts = new Map<string, number>();

  if (ids.length) {
    const { data: portfolios, error: portfolioError } = await client
      .from("portfolios")
      .select("user_id")
      .in("user_id", ids);

    if (portfolioError) throw new Error("Unable to load user statistics.");

    for (const portfolio of portfolios ?? []) {
      portfolioCounts.set(
        portfolio.user_id,
        (portfolioCounts.get(portfolio.user_id) ?? 0) + 1,
      );
    }
  }

  const authUsers = await Promise.all(
    rows.map((profile) => client.auth.admin.getUserById(profile.id)),
  );
  const items = rows.map((profile, index) => ({
    ...adminProfile(profile),
    email: authUsers[index].data.user?.email ?? null,
    portfolioCount: portfolioCounts.get(profile.id) ?? 0,
  }));

  return { items, total: count ?? 0, page, pageSize };
}

export async function getAdminPortfolioStats() {
  await requireAdmin();
  const client = createAdminClient();
  const [total, published, draft, privatePortfolios] = await Promise.all([
    client.from("portfolios").select("id", { count: "exact", head: true }),
    client
      .from("portfolios")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    client
      .from("portfolios")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
    client
      .from("portfolios")
      .select("id", { count: "exact", head: true })
      .eq("status", "private"),
  ]);

  if (total.error || published.error || draft.error || privatePortfolios.error) {
    throw new Error("Unable to load portfolio statistics.");
  }

  return {
    totalPortfolios: total.count ?? 0,
    publishedPortfolios: published.count ?? 0,
    draftPortfolios: draft.count ?? 0,
    privatePortfolios: privatePortfolios.count ?? 0,
  };
}

export async function getAdminPortfolioFilters() {
  await requireAdmin();
  const client = createAdminClient();
  const [themes, owners] = await Promise.all([
    client.from("themes").select("id, name").order("name"),
    client
      .from("profiles")
      .select("id, full_name, username")
      .order("full_name"),
  ]);

  if (themes.error || owners.error) {
    throw new Error("Unable to load portfolio filters.");
  }

  return { themes: themes.data ?? [], owners: owners.data ?? [] };
}

export async function getAdminPortfolios(
  options: PortfolioOptions,
): Promise<PageResult<AdminPortfolio>> {
  await requireAdmin();
  const { page, pageSize, from, to } = pagination(
    options.page,
    options.pageSize,
  );
  const search = safeSearch(options.search);
  const orderColumn =
    options.order === "title"
      ? "title"
      : options.order === "newest" || options.order === "oldest"
        ? "created_at"
        : "updated_at";
  const client = createAdminClient();
  let query = client
    .from("portfolios")
    .select(
      "id, user_id, slug, title, theme_id, status, created_at, updated_at, published_at, owner:profiles!portfolios_user_id_fkey(full_name,username,avatar_url), theme:themes!portfolios_theme_id_fkey(name,slug,layout_key)",
      { count: "exact" },
    )
    .order(orderColumn, {
      ascending: options.order === "oldest" || options.order === "title",
    })
    .range(from, to);

  if (options.status) query = query.eq("status", options.status);
  if (options.themeId) query = query.eq("theme_id", options.themeId);
  if (options.ownerId) query = query.eq("user_id", options.ownerId);
  if (search) query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);

  const { data, count, error } = await query;

  if (error) throw new Error("Unable to load portfolios.");

  const rows = data ?? [];
  const viewCounts = await Promise.all(
    rows.map((portfolio) =>
      client
        .from("portfolio_events")
        .select("id", { count: "exact", head: true })
        .eq("portfolio_id", portfolio.id)
        .eq("event_type", "view"),
    ),
  );

  if (viewCounts.some((result) => result.error)) {
    throw new Error("Unable to load portfolio analytics.");
  }

  const items: AdminPortfolio[] = rows.map((portfolio, index) => ({
    id: portfolio.id,
    user_id: portfolio.user_id,
    slug: portfolio.slug,
    title: portfolio.title,
    theme_id: portfolio.theme_id,
    status: portfolioStatus(portfolio.status),
    created_at: portfolio.created_at,
    updated_at: portfolio.updated_at,
    published_at: portfolio.published_at,
    owner: relatedOne(portfolio.owner),
    theme: relatedOne(portfolio.theme),
    views: viewCounts[index].count ?? 0,
  }));

  return { items, total: count ?? 0, page, pageSize };
}

export async function getAdminResumeStats() {
  await requireAdmin();
  const client = createAdminClient();
  const [total, processing, completed, failed] = await Promise.all([
    client.from("resumes").select("id", { count: "exact", head: true }),
    client
      .from("resumes")
      .select("id", { count: "exact", head: true })
      .eq("status", "processing"),
    client
      .from("resumes")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    client
      .from("resumes")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed"),
  ]);

  if (total.error || processing.error || completed.error || failed.error) {
    throw new Error("Unable to load resume statistics.");
  }

  return {
    totalResumes: total.count ?? 0,
    processingResumes: processing.count ?? 0,
    completedResumes: completed.count ?? 0,
    failedResumes: failed.count ?? 0,
  };
}

export async function getAdminResumes(
  options: ResumeOptions,
): Promise<PageResult<AdminResume>> {
  await requireAdmin();
  const { page, pageSize, from, to } = pagination(
    options.page,
    options.pageSize,
  );
  const search = safeSearch(options.search);
  const client = createAdminClient();
  let query = client
    .from("resumes")
    .select(
      "id, user_id, file_name, status, improve_with_ai, created_at, updated_at, owner:profiles!resumes_user_id_fkey(full_name,username,avatar_url)",
      { count: "exact" },
    )
    .order(options.order === "updated" ? "updated_at" : "created_at", {
      ascending: options.order === "oldest",
    })
    .range(from, to);

  if (options.status) query = query.eq("status", options.status);
  if (typeof options.improveWithAi === "boolean") {
    query = query.eq("improve_with_ai", options.improveWithAi);
  }
  if (options.ownerId) query = query.eq("user_id", options.ownerId);
  if (search) query = query.ilike("file_name", `%${search}%`);

  const { data, count, error } = await query;

  if (error) throw new Error("Unable to load resumes.");

  const items: AdminResume[] = (data ?? []).map((resume) => ({
    id: resume.id,
    user_id: resume.user_id,
    file_name: resume.file_name,
    status: resumeStatus(resume.status),
    improve_with_ai: resume.improve_with_ai,
    created_at: resume.created_at,
    updated_at: resume.updated_at,
    owner: relatedOne(resume.owner),
  }));

  return { items, total: count ?? 0, page, pageSize };
}

export async function getAdminThemeStats() {
  await requireAdmin();
  const client = createAdminClient();
  const [totalThemes, activeThemes, portfoliosUsingThemes] = await Promise.all([
    client.from("themes").select("id", { count: "exact", head: true }),
    client
      .from("themes")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    client
      .from("portfolios")
      .select("id", { count: "exact", head: true })
      .not("theme_id", "is", null),
  ]);

  if (totalThemes.error || activeThemes.error || portfoliosUsingThemes.error) {
    throw new Error("Unable to load theme statistics.");
  }

  return {
    totalThemes: totalThemes.count ?? 0,
    activeThemes: activeThemes.count ?? 0,
    portfoliosUsingThemes: portfoliosUsingThemes.count ?? 0,
  };
}

export type AdminThemeRegistryData = {
  entries: CodedThemeRegistryEntry[];
  databaseMetadataCount: number;
  readyToSaveCount: number;
  missingCount: number;
  duplicateCount: number;
  invalidCount: number;
  uninstalledRows: ThemeMetadataRow[];
};

export async function getAdminThemeRegistry(): Promise<AdminThemeRegistryData> {
  await requireAdmin();
  const { data, error } = await createAdminClient()
    .from("themes")
    .select(
      "id, name, slug, description, layout_key, preview_image_url, default_config, is_active, created_at, updated_at",
    )
    .order("layout_key");

  if (error) {
    throw new Error("Unable to load the coded theme registry.");
  }

  const rows = (data ?? []) as ThemeMetadataRow[];
  const entries = buildCodedThemeRegistryEntries(rows);

  return {
    entries,
    databaseMetadataCount: rows.length,
    readyToSaveCount: entries.filter((entry) => entry.canPersist).length,
    missingCount: entries.filter((entry) => entry.metadataState === "missing")
      .length,
    duplicateCount: entries.filter(
      (entry) => entry.metadataState === "duplicate",
    ).length,
    invalidCount: entries.filter((entry) => entry.metadataState === "invalid")
      .length,
    uninstalledRows: rows.filter(
      (row) => !entries.some((entry) => entry.layoutKey === row.layout_key),
    ),
  };
}

export async function getAdminThemes(
  options: ThemeOptions,
): Promise<PageResult<AdminTheme>> {
  await requireAdmin();
  const { page, pageSize, from, to } = pagination(
    options.page,
    options.pageSize,
  );
  const search = safeSearch(options.search);
  const orderColumn =
    options.order === "name"
      ? "name"
      : options.order === "newest"
        ? "created_at"
        : "updated_at";
  const client = createAdminClient();
  let query = client
    .from("themes")
    .select(
      "id, name, slug, description, layout_key, preview_image_url, default_config, is_active, created_at, updated_at",
      { count: "exact" },
    )
    .order(orderColumn, { ascending: options.order === "name" })
    .range(from, to);

  if (typeof options.isActive === "boolean") {
    query = query.eq("is_active", options.isActive);
  }
  if (search) query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);

  const { data, count, error } = await query;

  if (error) throw new Error("Unable to load themes.");

  const rows = data ?? [];
  const portfolioCounts = await Promise.all(
    rows.map((theme) =>
      client
        .from("portfolios")
        .select("id", { count: "exact", head: true })
        .eq("theme_id", theme.id),
    ),
  );

  if (portfolioCounts.some((result) => result.error)) {
    throw new Error("Unable to load theme usage.");
  }

  const items: AdminTheme[] = rows.map((theme, index) => {
    const config = ThemeConfigSchema.safeParse(theme.default_config);

    return {
      ...theme,
      default_config: config.success ? config.data : null,
      portfolioCount: portfolioCounts[index].count ?? 0,
    };
  });

  return { items, total: count ?? 0, page, pageSize };
}

export async function getAdminDeploymentStats() {
  await requireAdmin();
  const client = createAdminClient();
  const [total, current, historical, rolledBack] = await Promise.all([
    client.from("deployments").select("id", { count: "exact", head: true }),
    client
      .from("deployments")
      .select("id", { count: "exact", head: true })
      .eq("status", "current"),
    client
      .from("deployments")
      .select("id", { count: "exact", head: true })
      .eq("status", "historical"),
    client
      .from("deployments")
      .select("id", { count: "exact", head: true })
      .eq("status", "rolled_back"),
  ]);

  if (total.error || current.error || historical.error || rolledBack.error) {
    throw new Error("Unable to load deployment statistics.");
  }

  return {
    totalDeployments: total.count ?? 0,
    currentVersions: current.count ?? 0,
    historicalVersions: historical.count ?? 0,
    rolledBack: rolledBack.count ?? 0,
  };
}

export async function getAdminDeploymentFilters() {
  await requireAdmin();
  const { data, error } = await createAdminClient()
    .from("portfolios")
    .select("id, title, slug")
    .order("title");

  if (error) throw new Error("Unable to load deployment filters.");
  return { portfolios: data ?? [] };
}

function uuidSearch(value: string): string {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : "";
}

export async function getAdminDeployments(
  options: DeploymentOptions,
): Promise<PageResult<AdminDeployment>> {
  await requireAdmin();
  const { page, pageSize, from, to } = pagination(
    options.page,
    options.pageSize,
  );
  const search = safeSearch(options.search);
  const client = createAdminClient();
  let portfolioIds: string[] = [];

  if (search) {
    const { data, error } = await client
      .from("portfolios")
      .select("id")
      .or(`title.ilike.%${search}%,slug.ilike.%${search}%`);

    if (error) throw new Error("Unable to search deployments.");
    portfolioIds = (data ?? []).map((portfolio) => portfolio.id);
  }

  const matchedDeploymentId = uuidSearch(search);

  if (search && !matchedDeploymentId && !portfolioIds.length) {
    return { items: [], total: 0, page, pageSize };
  }

  let query = client
    .from("deployments")
    .select(
      "id, portfolio_id, version, theme_id, status, created_at, published_by, portfolio:portfolios!deployments_portfolio_id_fkey(title,slug,owner:profiles!portfolios_user_id_fkey(full_name,username,avatar_url)), theme:themes!deployments_theme_id_fkey(name,slug,layout_key), publisher:profiles!deployments_published_by_fkey(full_name,username)",
      { count: "exact" },
    )
    .order("created_at", { ascending: options.order === "oldest" })
    .range(from, to);

  if (options.status) query = query.eq("status", options.status);
  if (options.portfolioId) query = query.eq("portfolio_id", options.portfolioId);
  if (options.createdAfter) query = query.gte("created_at", options.createdAfter);
  if (search) {
    const matches = [
      matchedDeploymentId ? `id.eq.${matchedDeploymentId}` : "",
      portfolioIds.length
        ? `portfolio_id.in.(${portfolioIds.join(",")})`
        : "",
    ]
      .filter(Boolean)
      .join(",");
    query = query.or(matches);
  }

  const { data, count, error } = await query;

  if (error) throw new Error("Unable to load deployments.");

  const items: AdminDeployment[] = (data ?? []).map((deployment) => {
    const portfolio = relatedOne(deployment.portfolio);

    return {
      id: deployment.id,
      portfolio_id: deployment.portfolio_id,
      version: deployment.version,
      theme_id: deployment.theme_id,
      status: deploymentStatus(deployment.status),
      created_at: deployment.created_at,
      published_by: deployment.published_by,
      portfolio: portfolio
        ? { title: portfolio.title, slug: portfolio.slug }
        : null,
      owner: relatedOne(portfolio?.owner ?? null),
      theme: relatedOne(deployment.theme),
      publisher: relatedOne(deployment.publisher),
    };
  });

  return { items, total: count ?? 0, page, pageSize };
}

export type AdminFilterProfile = Pick<
  AdminProfile,
  "id" | "full_name" | "username"
>;
export type AdminFilterTheme = Pick<ThemeRow, "id" | "name">;
