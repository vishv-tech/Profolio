import { CheckCircle2, FolderCheck, Palette, Plus } from "lucide-react";
import Link from "next/link";

import {
  EmptyState,
  formatNumber,
  Notice,
  PageHeading,
  Pagination,
  StatCard,
  StatusBadge,
} from "@/components/admin/admin-primitives";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import {
  createTheme,
  deleteTheme,
  setThemeActive,
  updateTheme,
} from "@/lib/admin/actions";
import type { AdminTheme, PageResult } from "@/types/admin";
import type { ThemeConfig } from "@/types/theme";

type ThemeQuery = {
  search: string;
  status: "all" | "active" | "inactive";
  order: "updated" | "newest" | "name";
};

const NEW_THEME_CONFIG: ThemeConfig = {
  appearance: {
    colorMode: "light",
    backgroundColor: "#ffffff",
    surfaceColor: "#f8fafc",
    textColor: "#0f172a",
    mutedTextColor: "#64748b",
    accentColor: "#2563eb",
    borderColor: "#e2e8f0",
    fontFamily: "Geist",
    headingFontFamily: "Geist",
    borderRadius: 12,
    spacing: "comfortable",
    animationIntensity: "subtle",
  },
  sections: {
    order: [
      "summary",
      "experience",
      "education",
      "projects",
      "skills",
      "achievements",
      "certifications",
      "languages",
      "interests",
      "customSections",
    ],
    hidden: [],
  },
  visibility: {
    showProfileImage: true,
    showEmail: true,
    showPhone: true,
    showLocation: true,
    showLinks: true,
  },
};

function listHref(query: ThemeQuery, page: number): string {
  const params = new URLSearchParams({ status: query.status, order: query.order });
  if (page > 1) params.set("page", String(page));
  if (query.search) params.set("search", query.search);
  return `/admin/themes?${params}`;
}

function editorHref(query: ThemeQuery, key: "new" | "edit", value: string): string {
  const url = new URL(listHref(query, 1), "https://admin.invalid");
  url.searchParams.set(key, value);
  return `${url.pathname}?${url.searchParams}`;
}

function ThemeEditor({
  theme,
  layoutKeys,
  closeHref,
}: {
  theme?: AdminTheme;
  layoutKeys: string[];
  closeHref: string;
}) {
  const keys = [...new Set(theme ? [theme.layout_key, ...layoutKeys] : layoutKeys)];
  const config = theme?.default_config ?? NEW_THEME_CONFIG;

  return (
    <section className="admin-card admin-editor">
      <header>
        <div>
          <h2>{theme ? "Edit theme" : "Add theme metadata"}</h2>
          <p>Layouts come from the code registry; the database stores metadata and frozen ThemeConfig only.</p>
        </div>
        <Link href={closeHref}>Close</Link>
      </header>
      <form action={theme ? updateTheme : createTheme}>
        {theme ? <input name="id" type="hidden" value={theme.id} /> : null}
        <label>Name<input name="name" required minLength={2} maxLength={80} defaultValue={theme?.name} /></label>
        <label>Slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={100} defaultValue={theme?.slug} /></label>
        <label>Layout<select name="layoutKey" required defaultValue={theme?.layout_key ?? keys[0]}>{keys.map((key) => <option key={key} value={key}>{key}</option>)}</select></label>
        <label>Preview image URL<input name="previewImageUrl" type="url" defaultValue={theme?.preview_image_url ?? ""} placeholder="https://..." /></label>
        <label className="admin-editor__wide">Description<textarea name="description" maxLength={500} defaultValue={theme?.description ?? ""} /></label>
        <label className="admin-editor__wide">ThemeConfig JSON<textarea name="defaultConfig" required defaultValue={JSON.stringify(config, null, 2)} spellCheck={false} /></label>
        <label className="admin-editor__check"><input name="isActive" type="checkbox" defaultChecked={theme?.is_active ?? true} /> Available for selection</label>
        <div className="admin-editor__actions">
          <Link className="admin-button admin-button--secondary" href={closeHref}>Cancel</Link>
          <ConfirmActionButton className="admin-button admin-button--primary" type="submit" confirmation={theme ? "Save these changes? Existing portfolio metadata may reference this theme." : "Create this theme metadata record?"}>Save theme</ConfirmActionButton>
        </div>
      </form>
    </section>
  );
}

function ThemeCard({ theme, query }: { theme: AdminTheme; query: ThemeQuery }) {
  return <article className="admin-theme-card">
    <div className="admin-theme-card__preview">
      {theme.preview_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- administrator-provided remote hosts cannot be statically allow-listed
        <img src={theme.preview_image_url} alt={`${theme.name} preview`} />
      ) : (
        <span><Palette aria-hidden="true" />Preview not added</span>
      )}
    </div>
    <div className="admin-theme-card__body">
      <header><div><h3>{theme.name}</h3><p>{theme.description || "No description added."}</p></div><StatusBadge value={theme.is_active ? "active" : "inactive"} /></header>
      <dl><div><dt>Slug</dt><dd>{theme.slug}</dd></div><div><dt>Layout</dt><dd>{theme.layout_key}</dd></div><div><dt>Usage</dt><dd>{formatNumber(theme.portfolioCount)} portfolios</dd></div></dl>
      {!theme.default_config ? <p className="admin-theme-card__warning">Stored configuration does not match the frozen ThemeConfig contract.</p> : null}
      <div className="admin-theme-card__actions">
        <Link className="admin-button admin-button--secondary" href={editorHref(query, "edit", theme.id)}>Edit</Link>
        <form action={setThemeActive}><input name="themeId" type="hidden" value={theme.id} /><input name="isActive" type="hidden" value={String(!theme.is_active)} /><ConfirmActionButton type="submit" confirmation={`${theme.is_active ? "Deactivate" : "Activate"} ${theme.name}?`}>{theme.is_active ? "Deactivate" : "Activate"}</ConfirmActionButton></form>
        <form action={deleteTheme}><input name="themeId" type="hidden" value={theme.id} /><ConfirmActionButton className="is-danger" type="submit" confirmation={`Permanently delete ${theme.name}? This is allowed only when no portfolio or deployment references it.`}>Delete</ConfirmActionButton></form>
      </div>
    </div>
  </article>;
}

export function ThemeManagementScreen({
  themes,
  stats,
  query,
  layoutKeys,
  editor,
  message,
}: {
  themes: PageResult<AdminTheme>;
  stats: { totalThemes: number; activeThemes: number; portfoliosUsingThemes: number };
  query: ThemeQuery;
  layoutKeys: string[];
  editor?: { mode: "new" } | { mode: "edit"; theme: AdminTheme };
  message?: { kind: "success" | "error"; text: string };
}) {
  return <div className="admin-page">
    <PageHeading title="Theme management" description="Manage database metadata for layouts that exist in the compiled theme registry." actions={<Link className="admin-button admin-button--primary" href={editorHref(query, "new", "1")}><Plus aria-hidden="true" /> Add theme</Link>} />
    <div className="admin-stats admin-stats--three"><StatCard icon={Palette} label="Total themes" value={stats.totalThemes} tone="purple" /><StatCard icon={CheckCircle2} label="Active themes" value={stats.activeThemes} tone="green" /><StatCard icon={FolderCheck} label="Portfolios using themes" value={stats.portfoliosUsingThemes} /></div>
    {editor ? <ThemeEditor theme={editor.mode === "edit" ? editor.theme : undefined} layoutKeys={layoutKeys} closeHref={listHref(query, themes.page)} /> : null}
    <section className="admin-card admin-manager">
      <div className="admin-manager__filters"><form action="/admin/themes" className="admin-filter-form"><input name="search" type="search" defaultValue={query.search} placeholder="Search themes" aria-label="Search themes" /><select name="status" defaultValue={query.status}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select><select name="order" defaultValue={query.order}><option value="updated">Recently updated</option><option value="newest">Newest</option><option value="name">Name</option></select><button className="admin-button admin-button--primary" type="submit">Apply</button></form><Link href="/admin/themes">Clear filters</Link></div>
      <Notice message={message} />
      {themes.items.length ? <div className="admin-theme-grid">{themes.items.map((theme) => <ThemeCard key={theme.id} theme={theme} query={query} />)}</div> : <EmptyState icon={Palette} title="No themes found" description="Add metadata for a registered layout when you are ready." />}
      <Pagination result={themes} hrefForPage={(page) => listHref(query, page)} label="themes" />
    </section>
  </div>;
}
