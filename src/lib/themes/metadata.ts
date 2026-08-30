import { ThemeConfigSchema } from "@/lib/validation/theme";
import { defaultThemeConfig } from "@/themes/default-config";
import { allThemePack, allThemeRegistry } from "@/themes/registry";
import type { Tables } from "@/types/database";
import type { ThemeConfig } from "@/types/theme";

type ThemeRow = Tables<"themes">;

export type ThemeMetadataRow = Omit<
  Pick<
    ThemeRow,
    | "id"
    | "name"
    | "slug"
    | "description"
    | "layout_key"
    | "preview_image_url"
    | "default_config"
    | "is_active"
    | "created_at"
    | "updated_at"
  >,
  "default_config"
> & { default_config: unknown };

export type CodedThemeMetadata = {
  name: string;
  slug: string;
  description: string;
  layout_key: string;
  preview_image_url: string | null;
  default_config: ThemeConfig;
};

export type ThemeMetadataIssue = {
  layoutKey: string;
  kind: "duplicate-layout" | "slug-conflict";
  rowIds: string[];
};

export type ThemeMetadataSyncOperation =
  | {
      kind: "insert";
      layoutKey: string;
      record: CodedThemeMetadata & { is_active: true };
    }
  | {
      kind: "update";
      id: string;
      layoutKey: string;
      record: CodedThemeMetadata;
    };

export type ThemeMetadataSyncPlan = {
  operations: ThemeMetadataSyncOperation[];
  issues: ThemeMetadataIssue[];
  unchanged: string[];
  uninstalledRows: ThemeMetadataRow[];
};

export type CodedThemeRegistryEntry = {
  layoutKey: string;
  name: string;
  description: string;
  category: string;
  installed: true;
  metadataState: "missing" | "duplicate" | "invalid" | "ready";
  databaseRows: ThemeMetadataRow[];
  isActive: boolean;
  canPersist: boolean;
};

function cloneDefaultConfig(): ThemeConfig {
  return {
    appearance: { ...defaultThemeConfig.appearance },
    sections: {
      order: [...defaultThemeConfig.sections.order],
      hidden: [...defaultThemeConfig.sections.hidden],
    },
    visibility: { ...defaultThemeConfig.visibility },
  };
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export function codedThemeMetadata(
  layoutKey: string,
  existingPreviewImageUrl: string | null = null,
): CodedThemeMetadata | null {
  const manifest = allThemeRegistry.get(layoutKey);

  if (!manifest) {
    return null;
  }

  return {
    name: manifest.name,
    slug: manifest.layoutKey,
    description: manifest.description,
    layout_key: manifest.layoutKey,
    preview_image_url: manifest.previewImage ?? existingPreviewImageUrl,
    default_config: cloneDefaultConfig(),
  };
}

function rowMatchesMetadata(
  row: ThemeMetadataRow,
  metadata: CodedThemeMetadata,
): boolean {
  const config = ThemeConfigSchema.safeParse(row.default_config);

  return (
    row.name === metadata.name &&
    row.slug === metadata.slug &&
    row.description === metadata.description &&
    row.layout_key === metadata.layout_key &&
    row.preview_image_url === metadata.preview_image_url &&
    config.success &&
    stableJson(config.data) === stableJson(metadata.default_config)
  );
}

export function planCodedThemeMetadataSync(
  rows: readonly ThemeMetadataRow[],
): ThemeMetadataSyncPlan {
  const rowsByLayout = new Map<string, ThemeMetadataRow[]>();
  const rowsBySlug = new Map<string, ThemeMetadataRow[]>();

  for (const row of rows) {
    rowsByLayout.set(row.layout_key, [
      ...(rowsByLayout.get(row.layout_key) ?? []),
      row,
    ]);
    rowsBySlug.set(row.slug, [...(rowsBySlug.get(row.slug) ?? []), row]);
  }

  const operations: ThemeMetadataSyncOperation[] = [];
  const issues: ThemeMetadataIssue[] = [];
  const unchanged: string[] = [];

  for (const manifest of allThemePack) {
    const matches = rowsByLayout.get(manifest.layoutKey) ?? [];

    if (matches.length > 1) {
      issues.push({
        layoutKey: manifest.layoutKey,
        kind: "duplicate-layout",
        rowIds: matches.map((row) => row.id),
      });
      continue;
    }

    const matchingRow = matches[0];
    const conflictingSlugRows = (rowsBySlug.get(manifest.layoutKey) ?? []).filter(
      (row) => row.id !== matchingRow?.id,
    );

    if (conflictingSlugRows.length) {
      issues.push({
        layoutKey: manifest.layoutKey,
        kind: "slug-conflict",
        rowIds: conflictingSlugRows.map((row) => row.id),
      });
      continue;
    }

    const metadata = codedThemeMetadata(
      manifest.layoutKey,
      matchingRow?.preview_image_url ?? null,
    );

    if (!metadata) {
      continue;
    }

    if (!matchingRow) {
      operations.push({
        kind: "insert",
        layoutKey: manifest.layoutKey,
        record: { ...metadata, is_active: true },
      });
    } else if (rowMatchesMetadata(matchingRow, metadata)) {
      unchanged.push(manifest.layoutKey);
    } else {
      operations.push({
        kind: "update",
        id: matchingRow.id,
        layoutKey: manifest.layoutKey,
        record: metadata,
      });
    }
  }

  return {
    operations,
    issues,
    unchanged,
    uninstalledRows: rows.filter(
      (row) => !allThemeRegistry.has(row.layout_key),
    ),
  };
}

export function buildCodedThemeRegistryEntries(
  rows: readonly ThemeMetadataRow[],
): CodedThemeRegistryEntry[] {
  const rowsByLayout = new Map<string, ThemeMetadataRow[]>();

  for (const row of rows) {
    rowsByLayout.set(row.layout_key, [
      ...(rowsByLayout.get(row.layout_key) ?? []),
      row,
    ]);
  }

  return allThemePack.map((manifest) => {
    const databaseRows = rowsByLayout.get(manifest.layoutKey) ?? [];
    const uniqueRow = databaseRows.length === 1 ? databaseRows[0] : null;
    const configIsValid = uniqueRow
      ? ThemeConfigSchema.safeParse(uniqueRow.default_config).success
      : false;
    const metadataState =
      databaseRows.length === 0
        ? "missing"
        : databaseRows.length > 1
          ? "duplicate"
          : configIsValid
            ? "ready"
            : "invalid";

    return {
      layoutKey: manifest.layoutKey,
      name: manifest.name,
      description: manifest.description,
      category: manifest.category,
      installed: true,
      metadataState,
      databaseRows,
      isActive: Boolean(uniqueRow?.is_active),
      canPersist: Boolean(uniqueRow?.is_active && configIsValid),
    };
  });
}

export function isUniqueActiveCodedTheme(
  rows: readonly Pick<ThemeMetadataRow, "id" | "layout_key" | "is_active" | "default_config">[],
  expectedLayoutKey: string,
): boolean {
  return (
    allThemeRegistry.has(expectedLayoutKey) &&
    rows.length === 1 &&
    rows[0].layout_key === expectedLayoutKey &&
    rows[0].is_active &&
    ThemeConfigSchema.safeParse(rows[0].default_config).success
  );
}
