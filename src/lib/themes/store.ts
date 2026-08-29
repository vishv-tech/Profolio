import { z } from "zod";

import { allThemePack, allThemeRegistry } from "@/themes/registry";
import { resolveThemeConfig } from "@/themes/default-config";
import type { ThemeConfig } from "@/types/theme";

export const ThemeDatabaseMetadataSchema = z.strictObject({
  id: z.string().uuid(),
  layout_key: z.string().min(1).max(100),
  default_config: z.unknown(),
  preview_image_url: z.string().nullable(),
});

export type ThemeDatabaseMetadata = z.infer<
  typeof ThemeDatabaseMetadataSchema
>;

export type ThemeStoreEntry = {
  layoutKey: string;
  name: string;
  description: string;
  category: string;
  careerTags: readonly string[];
  styleTags: readonly string[];
  previewImage: string | null;
  config: ThemeConfig;
  databaseThemeId: string | null;
  canPersist: boolean;
};

function safePreviewImage(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function resolveThemeLayoutKey(
  requestedLayoutKey: string | undefined,
  savedLayoutKey: string | null,
): string | null {
  if (requestedLayoutKey && allThemeRegistry.has(requestedLayoutKey)) {
    return requestedLayoutKey;
  }

  if (savedLayoutKey && allThemeRegistry.has(savedLayoutKey)) {
    return savedLayoutKey;
  }

  return allThemePack[0]?.layoutKey ?? null;
}

export function buildThemeStoreCatalog({
  databaseThemes,
  savedThemeConfig,
  savedThemeId,
}: {
  databaseThemes: readonly ThemeDatabaseMetadata[];
  savedThemeConfig: unknown;
  savedThemeId: string | null;
}): ThemeStoreEntry[] {
  const rowsByLayoutKey = new Map<
    string,
    ThemeDatabaseMetadata | null
  >();

  for (const row of databaseThemes) {
    rowsByLayoutKey.set(
      row.layout_key,
      rowsByLayoutKey.has(row.layout_key) ? null : row,
    );
  }

  return allThemePack.map((manifest) => {
    const databaseTheme = rowsByLayoutKey.get(manifest.layoutKey) ?? null;
    const useSavedConfig = databaseTheme?.id === savedThemeId;

    return {
      layoutKey: manifest.layoutKey,
      name: manifest.name,
      description: manifest.description,
      category: manifest.category,
      careerTags: manifest.careerTags,
      styleTags: manifest.styleTags,
      previewImage: safePreviewImage(
        manifest.previewImage ?? databaseTheme?.preview_image_url,
      ),
      config: resolveThemeConfig(
        useSavedConfig ? savedThemeConfig : databaseTheme?.default_config,
      ),
      databaseThemeId: databaseTheme?.id ?? null,
      canPersist: Boolean(databaseTheme),
    };
  });
}
