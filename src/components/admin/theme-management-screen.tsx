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
  missing: "Setup required",
  duplicate: "Needs attention",
  invalid: "Configuration issue",
  ready: "Ready",
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
              <span>Installed theme</span>
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
            <dt>Readiness</dt>
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
              <strong>{entry.databaseRows.length} records use this layout.</strong>
              <p>Keep one record before making the theme available.</p>
            </div>
          </div>
        ) : entry.metadataState === "invalid" ? (
          <div className="admin-theme-registry-card__warning">
            <AlertTriangle aria-hidden="true" />
            <p>Sync installed themes to restore the approved configuration.</p>
          </div>
        ) : entry.metadataState === "missing" ? (
          <div className="admin-theme-registry-card__warning">
            <Database aria-hidden="true" />
            <p>This theme has not been synchronized yet.</p>
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
        title="Theme management"
        description="Review installed themes, availability, and publishing readiness."
        actions={
          <form action={syncCodedThemes}>
            <ConfirmActionButton
              className="admin-button admin-button--primary"
              type="submit"
              confirmation="Synchronize all installed themes? Existing availability choices are preserved."
            >
              <FolderSync aria-hidden="true" />
              Sync themes
            </ConfirmActionButton>
          </form>
        }
      />

      <div className="admin-stats admin-stats--three">
        <StatCard icon={Code2} label="Installed themes" value={registry.entries.length} tone="purple" />
        <StatCard icon={CheckCircle2} label="Ready" value={registry.readyToSaveCount} tone="green" />
        <StatCard icon={Database} label="Theme records" value={registry.databaseMetadataCount} />
      </div>

      <section className="admin-card admin-manager">
        <div className="admin-manager__filters">
          <form action="/admin/themes" className="admin-filter-form">
            <input
              name="search"
              type="search"
              defaultValue={query.search}
              placeholder="Search themes"
              aria-label="Search themes"
            />
            <select name="status" defaultValue={query.status} aria-label="Filter theme availability">
              <option value="all">All availability</option>
              <option value="active">Active metadata</option>
              <option value="inactive">Inactive or missing</option>
            </select>
            <select name="order" defaultValue={query.order} aria-label="Sort themes">
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
              {registry.missingCount} need setup · {registry.duplicateCount} duplicate · {registry.invalidCount} invalid. Only ready, active themes are available for publishing.
            </p>
          </div>
        ) : null}

        {registry.uninstalledRows.length ? (
          <div className="admin-theme-registry-summary is-error">
            <AlertTriangle aria-hidden="true" />
            <p>
              {registry.uninstalledRows.length} theme record(s) do not match an installed theme and cannot be selected.
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
            <h2>No themes match these filters</h2>
            <p>Clear the filters to return to the complete installed registry.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
