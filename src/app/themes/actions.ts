"use server";

import { revalidatePath } from "next/cache";

import { requireActiveUser } from "@/lib/auth/guards";
import { PortfolioIdSchema } from "@/lib/portfolios/contracts";
import { logPortfolioDatabaseError } from "@/lib/portfolios/database-errors";
import { toDatabaseJson } from "@/lib/resumes/json";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isUniqueActiveCodedTheme } from "@/lib/themes/metadata";
import { ThemeDatabaseMetadataSchema } from "@/lib/themes/store";
import { ThemeConfigSchema } from "@/lib/validation/theme";
import { resolveThemeConfig } from "@/themes/default-config";
import { getThemeManifest } from "@/themes/registry";
import type { ThemeConfig } from "@/types/theme";

export type SelectPortfolioThemeResult =
  | {
      success: true;
      layoutKey: string;
      themeConfig: ThemeConfig;
    }
  | { success: false; message: string };

export async function selectPortfolioTheme(
  portfolioId: string,
  layoutKey: string,
): Promise<SelectPortfolioThemeResult> {
  const user = await requireActiveUser();
  const parsedPortfolioId = PortfolioIdSchema.safeParse(portfolioId);
  const manifest = getThemeManifest(layoutKey);

  if (!parsedPortfolioId.success || !manifest) {
    return {
      success: false,
      message: "That portfolio theme is unavailable.",
    };
  }

  const supabase = await createClient();
  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .select("id, theme_id, theme_config")
    .eq("id", parsedPortfolioId.data)
    .eq("user_id", user.userId)
    .maybeSingle();

  if (portfolioError || !portfolio) {
    logPortfolioDatabaseError(
      "theme-selection-read",
      portfolioError,
      parsedPortfolioId.data,
    );
    return { success: false, message: "That portfolio is unavailable." };
  }

  const { data: matchingThemes, error: themeError } = await createAdminClient()
    .from("themes")
    .select("id, layout_key, default_config, preview_image_url, is_active")
    .eq("layout_key", manifest.layoutKey);

  const parsedThemes = (matchingThemes ?? []).flatMap((theme) => {
    const parsed = ThemeDatabaseMetadataSchema.safeParse(theme);
    return parsed.success ? [parsed.data] : [];
  });
  const parsedTheme = parsedThemes[0];

  if (
    themeError ||
    parsedThemes.length !== (matchingThemes?.length ?? 0) ||
    !isUniqueActiveCodedTheme(parsedThemes, manifest.layoutKey)
  ) {
    logPortfolioDatabaseError(
      "theme-selection-metadata",
      themeError,
      parsedPortfolioId.data,
    );
    return {
      success: false,
      message:
        "This theme is available to preview but its database metadata is not ready yet.",
    };
  }

  const savedConfig = ThemeConfigSchema.safeParse(portfolio.theme_config);
  const themeConfig =
    portfolio.theme_id === parsedTheme.id && savedConfig.success
      ? savedConfig.data
      : resolveThemeConfig(parsedTheme.default_config);
  const { data: updatedPortfolio, error: updateError } = await supabase
    .from("portfolios")
    .update({
      theme_id: parsedTheme.id,
      theme_config: toDatabaseJson(themeConfig),
    })
    .eq("id", parsedPortfolioId.data)
    .eq("user_id", user.userId)
    .select("id")
    .maybeSingle();

  if (updateError || !updatedPortfolio) {
    logPortfolioDatabaseError(
      "theme-selection-update",
      updateError,
      parsedPortfolioId.data,
    );
    return {
      success: false,
      message: "The theme choice could not be saved. Please try again.",
    };
  }

  revalidatePath("/themes");
  revalidatePath("/dashboard");

  return {
    success: true,
    layoutKey: manifest.layoutKey,
    themeConfig,
  };
}
