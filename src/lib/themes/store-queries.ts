import "server-only";

import { z } from "zod";

import { PortfolioIdSchema } from "@/lib/portfolios/contracts";
import { logPortfolioDatabaseError } from "@/lib/portfolios/database-errors";
import { createClient } from "@/lib/supabase/server";
import {
  ThemeDatabaseMetadataSchema,
  type ThemeDatabaseMetadata,
} from "@/lib/themes/store";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";
import type { PortfolioData } from "@/types/portfolio";

const ThemeStorePortfolioRowSchema = z.strictObject({
  id: z.string().uuid(),
  title: z.string().min(1),
  draft_content: z.unknown(),
  theme_id: z.string().uuid().nullable(),
  theme_config: z.unknown(),
});

export type ThemeStorePortfolio = {
  id: string;
  title: string;
  draftContent: PortfolioData;
  themeId: string | null;
  themeConfig: unknown;
};

export type ThemeStoreLoadResult =
  | { status: "unavailable" }
  | { status: "invalid-draft" }
  | {
      status: "ready";
      portfolio: ThemeStorePortfolio;
      databaseThemes: ThemeDatabaseMetadata[];
      metadataReadFailed: boolean;
    };

export async function getOwnedThemeStorePortfolio(
  portfolioId: string,
  userId: string,
): Promise<ThemeStoreLoadResult> {
  const parsedId = PortfolioIdSchema.safeParse(portfolioId);

  if (!parsedId.success) {
    return { status: "unavailable" };
  }

  const supabase = await createClient();
  const [portfolioResult, themesResult] = await Promise.all([
    supabase
      .from("portfolios")
      .select("id, title, draft_content, theme_id, theme_config")
      .eq("id", parsedId.data)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("themes")
      .select("id, layout_key, default_config, preview_image_url")
      .eq("is_active", true),
  ]);

  if (portfolioResult.error || !portfolioResult.data) {
    logPortfolioDatabaseError(
      "theme-store-read",
      portfolioResult.error,
      parsedId.data,
    );
    return { status: "unavailable" };
  }

  const portfolioRow = ThemeStorePortfolioRowSchema.safeParse(
    portfolioResult.data,
  );

  if (!portfolioRow.success) {
    return { status: "unavailable" };
  }

  const draftContent = PortfolioDataSchema.safeParse(
    portfolioRow.data.draft_content,
  );

  if (!draftContent.success) {
    return { status: "invalid-draft" };
  }

  if (themesResult.error) {
    logPortfolioDatabaseError(
      "theme-store-metadata",
      themesResult.error,
      parsedId.data,
    );
  }

  const databaseThemes = (themesResult.data ?? []).flatMap((row) => {
    const parsed = ThemeDatabaseMetadataSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });

  return {
    status: "ready",
    portfolio: {
      id: portfolioRow.data.id,
      title: portfolioRow.data.title,
      draftContent: draftContent.data,
      themeId: portfolioRow.data.theme_id,
      themeConfig: portfolioRow.data.theme_config,
    },
    databaseThemes,
    metadataReadFailed: Boolean(themesResult.error),
  };
}
