import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Database,
  FolderSync,
  Palette,
  Power,
} from "lucide-react";
import Link from "next/link";

import {
  Notice,
  PageHeading,
  StatCard,
  StatusBadge,
} from "@/components/admin/admin-primitives";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import {
  deleteTheme,
  setThemeActive,
  syncCodedThemes,
} from "@/lib/admin/actions";
import type { AdminThemeRegistryData } from "@/lib/admin/queries";
import type { CodedThemeRegistryEntry } from "@/lib/themes/metadata";

type ThemeQuery = {
  search: string;
  status: "all" | "active" | "inactive";
  order: "registry" | "name";
};

const STATE_LABELS = {
  missing: "Missing metadata",
  duplicate: "Duplicate / error",
  invalid: "Invalid config",
  ready: "Metadata ready",
} as const;

function ThemeRegistryCard({ entry }: { entry: CodedThemeRegistryEntry }) {
  const uniqueRow = entry.databaseRows.length === 1 ? entry.databaseRows[0] : null;
  const stateTone =
    entry.metadataState === "ready"
      ? entry.canPersist
        ? "active"
        : "inactive"
      : "failed";

  return (
    <article className="admin-theme-card admin-theme-registry-card">
      <div className="admin-theme-card__body">
        <header>
          <div>
            <div className="admin-theme-registry-card__eyebrow">
              <span>{entry.category}</span>
              <span>Installed in code</span>
            </div>
            <h3>{entry.name}</h3>
            <p>{entry.description}</p>
          </div>
          <StatusBadge value={stateTone} />
        </header>

        <dl>
          <div>
            <dt>Layout key</dt>
            <dd>{entry.layoutKey}</dd>
          </div>
          <div>
            <dt>Database</dt>
            <dd>{STATE_LABELS[entry.metadataState]}</dd>
          </div>
          <div>
            <dt>Production</dt>
            <dd>{entry.canPersist ? "Ready to save" : "Preview only"}</dd>
          </div>
        </dl>

        {entry.metadataState === "duplicate" ? (
          <div className="admin-theme-registry-card__warning">
            <AlertTriangle aria-hidden="true" />
            <div>
              <strong>{entry.databaseRows.length} rows use this layout key.</strong>
              <p>Saving and publishing stay blocked until exactly one row remains.</p>
            </div>
          </div>
        ) : entry.metadataState === "invalid" ? (
          <div className="admin-theme-registry-card__warning">
            <AlertTriangle aria-hidden="true" />
            <p>Run coded-theme sync to restore the canonical ThemeConfig.</p>
          </div>
        ) : entry.metadataState === "missing" ? (
          <div className="admin-theme-registry-card__warning">
            <Database aria-hidden="true" />
            <p>No database metadata row exists yet. Run coded-theme sync.</p>
          </div>
        ) : null}

        {uniqueRow && entry.metadataState === "ready" ? (
          <div className="admin-theme-card__actions">
            <form action={setThemeActive}>
              <input name="themeId" type="hidden" value={uniqueRow.id} />
              <input
                name="isActive"
                type="hidden"
                value={String(!uniqueRow.is_active)}
              />
              <ConfirmActionButton
                type="submit"
                confirmation={`${uniqueRow.is_active ? "Deactivate" : "Activate"} ${entry.name}?`}
              >
                <Power aria-hidden="true" />
                {uniqueRow.is_active ? "Deactivate" : "Activate"}
              </ConfirmActionButton>
            </form>
          </div>
        ) : null}

        {entry.metadataState === "duplicate" ? (
          <div className="admin-theme-registry-card__duplicates">
            {entry.databaseRows.map((row) => (
              <div key={row.id}>
                <span>
                  {row.name} · {row.is_active ? "active" : "inactive"} · {row.id.slice(0, 8)}
                </span>
                <form action={deleteTheme}>
                  <input name="themeId" type="hidden" value={row.id} />
                  <ConfirmActionButton
                    className="is-danger"
                    type="submit"
                    confirmation={`Delete duplicate metadata row ${row.id}? Referenced rows cannot be deleted.`}
                  >
                    Delete duplicate
                  </ConfirmActionButton>
                </form>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function ThemeManagementScreen({
  registry,
  query,
  message,
}: {
  registry: AdminThemeRegistryData;
  query: ThemeQuery;
  message?: { kind: "success" | "error"; text: string };
}) {
  const normalizedSearch = query.search.trim().toLocaleLowerCase();
  const entries = registry.entries
    .filter((entry) => {
      if (query.status === "active" && !entry.isActive) return false;
      if (query.status === "inactive" && entry.isActive) return false;
      if (!normalizedSearch) return true;
      return `${entry.name} ${entry.layoutKey} ${entry.category}`
        .toLocaleLowerCase()
        .includes(normalizedSearch);
    })
    .sort((left, right) =>
      query.order === "name" ? left.name.localeCompare(right.name) : 0,
    );

  return (
    <div className="admin-page">
      <PageHeading
        title="Coded theme registry"
        description="Application manifests define installed themes. Supabase stores synchronized metadata and availability only."
        actions={
          <form action={syncCodedThemes}>
            <ConfirmActionButton
              className="admin-button admin-button--primary"
              type="submit"
              confirmation="Synchronize all coded theme manifests with database metadata? Existing active/inactive choices are preserved."
            >
              <FolderSync aria-hidden="true" />
              Sync coded themes
            </ConfirmActionButton>
          </form>
        }
      />

      <div className="admin-stats admin-stats--three">
        <StatCard icon={Code2} label="Installed in code" value={registry.entries.length} tone="purple" />
        <StatCard icon={CheckCircle2} label="Ready to save" value={registry.readyToSaveCount} tone="green" />
        <StatCard icon={Database} label="Database rows" value={registry.databaseMetadataCount} />
      </div>

      <section className="admin-card admin-manager">
        <div className="admin-manager__filters">
          <form action="/admin/themes" className="admin-filter-form">
            <input
              name="search"
              type="search"
              defaultValue={query.search}
              placeholder="Search coded themes"
              aria-label="Search coded themes"
            />
            <select name="status" defaultValue={query.status}>
              <option value="all">All availability</option>
              <option value="active">Active metadata</option>
              <option value="inactive">Inactive or missing</option>
            </select>
            <select name="order" defaultValue={query.order}>
              <option value="registry">Registry order</option>
              <option value="name">Name</option>
            </select>
            <button className="admin-button admin-button--primary" type="submit">
              Apply
            </button>
          </form>
          <Link href="/admin/themes">Clear filters</Link>
        </div>

        <Notice message={message} />

        {registry.missingCount || registry.duplicateCount || registry.invalidCount ? (
          <div className="admin-theme-registry-summary">
            <AlertTriangle aria-hidden="true" />
            <p>
              {registry.missingCount} missing · {registry.duplicateCount} duplicate · {registry.invalidCount} invalid. Only unique, active rows with canonical ThemeConfig are available in production.
            </p>
          </div>
        ) : null}

        {registry.uninstalledRows.length ? (
          <div className="admin-theme-registry-summary is-error">
            <AlertTriangle aria-hidden="true" />
            <p>
              {registry.uninstalledRows.length} database row(s) reference layout keys that are not installed in code. They are never synchronized or selectable.
            </p>
          </div>
        ) : null}

        <div className="admin-theme-grid">
          {entries.map((entry) => (
            <ThemeRegistryCard entry={entry} key={entry.layoutKey} />
          ))}
        </div>

        {!entries.length ? (
          <div className="admin-empty">
            <span><Palette aria-hidden="true" /></span>
            <h2>No coded themes match these filters</h2>
            <p>Clear the filters to return to the complete installed registry.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
