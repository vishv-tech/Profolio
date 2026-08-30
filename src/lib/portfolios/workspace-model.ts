import { z } from "zod";

import { PortfolioIdSchema, PortfolioSlugSchema } from "@/lib/portfolios/contracts";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";
import { getThemeManifest } from "@/themes/registry";
import type { PortfolioData } from "@/types/portfolio";

export const WorkspacePortfolioChoiceSchema = z.strictObject({
  id: z.string().uuid(),
  title: z.string().trim().min(1),
  slug: PortfolioSlugSchema,
  status: z.enum(["draft", "published", "private"]),
  updated_at: z.string(),
});

export const WorkspacePortfolioRowSchema = WorkspacePortfolioChoiceSchema.extend({
  draft_content: PortfolioDataSchema,
  theme_id: z.string().uuid().nullable(),
  created_at: z.string(),
  published_at: z.string().nullable(),
});

export const WorkspaceThemeRowSchema = z.strictObject({
  id: z.string().uuid(),
  name: z.string().trim().min(1),
  layout_key: z.string().trim().min(1),
});

export type WorkspacePortfolioChoice = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "private";
  updatedAt: string;
};

export type WorkspacePortfolio = WorkspacePortfolioChoice & {
  createdAt: string;
  publishedAt: string | null;
  draftContent: PortfolioData;
  theme: {
    id: string;
    layoutKey: string;
    name: string;
  } | null;
};

export type PortfolioSelection =
  | { status: "empty" }
  | { status: "unavailable" }
  | { status: "selected"; id: string };

export function parseWorkspaceChoices(rows: unknown[]): WorkspacePortfolioChoice[] {
  return rows.flatMap((row) => {
    const parsed = WorkspacePortfolioChoiceSchema.safeParse(row);
    return parsed.success
      ? [
          {
            id: parsed.data.id,
            title: parsed.data.title,
            slug: parsed.data.slug,
            status: parsed.data.status,
            updatedAt: parsed.data.updated_at,
          } satisfies WorkspacePortfolioChoice,
        ]
      : [];
  });
}

export function resolveWorkspaceSelection(
  portfolios: WorkspacePortfolioChoice[],
  requestedPortfolioId: string | null,
): PortfolioSelection {
  if (portfolios.length === 0) return { status: "empty" };
  if (!requestedPortfolioId) return { status: "selected", id: portfolios[0].id };

  const parsedId = PortfolioIdSchema.safeParse(requestedPortfolioId);
  return parsedId.success && portfolios.some(({ id }) => id === parsedId.data)
    ? { status: "selected", id: parsedId.data }
    : { status: "unavailable" };
}

export function buildWorkspacePortfolio(
  rowValue: unknown,
  themeValue: unknown,
): WorkspacePortfolio | null {
  const row = WorkspacePortfolioRowSchema.safeParse(rowValue);
  if (!row.success) return null;

  const theme = WorkspaceThemeRowSchema.safeParse(themeValue);
  const manifest = theme.success ? getThemeManifest(theme.data.layout_key) : null;
  const selectedTheme =
    row.data.theme_id &&
    theme.success &&
    manifest &&
    theme.data.id === row.data.theme_id
      ? {
          id: theme.data.id,
          layoutKey: manifest.layoutKey,
          name: manifest.name,
        }
      : null;

  return {
    id: row.data.id,
    title: row.data.title,
    slug: row.data.slug,
    status: row.data.status,
    createdAt: row.data.created_at,
    updatedAt: row.data.updated_at,
    publishedAt: row.data.published_at,
    draftContent: row.data.draft_content,
    theme: selectedTheme,
  };
}
