"use server";

import { revalidatePath } from "next/cache";

import { requireActiveUser } from "@/lib/auth/guards";
import {
  PortfolioIdSchema,
  type PublishPortfolioResult,
} from "@/lib/portfolios/contracts";
import { logPortfolioDatabaseError } from "@/lib/portfolios/database-errors";
import { toDatabaseJson } from "@/lib/resumes/json";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isUniqueActiveCodedTheme } from "@/lib/themes/metadata";
import { ThemeDatabaseMetadataSchema } from "@/lib/themes/store";
import { validatePortfolioPublication } from "@/lib/portfolios/validation";
import { getThemeManifest } from "@/themes/registry";

export async function publishPortfolio(
  portfolioId: string,
): Promise<PublishPortfolioResult> {
  const user = await requireActiveUser();
  const parsedId = PortfolioIdSchema.safeParse(portfolioId);

  if (!parsedId.success) {
    return { success: false, message: "That portfolio is unavailable." };
  }

  const supabase = await createClient();
  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .select("id, slug, draft_content, theme_id, theme_config")
    .eq("id", parsedId.data)
    .eq("user_id", user.userId)
    .maybeSingle();

  if (portfolioError || !portfolio) {
    logPortfolioDatabaseError("publish-read", portfolioError, parsedId.data);
    return { success: false, message: "That portfolio is unavailable." };
  }

  const validation = validatePortfolioPublication(
    portfolio.draft_content,
    portfolio.theme_id,
    portfolio.theme_config,
  );

  if (!validation.success && validation.reason === "invalid-content") {
    return {
      success: false,
      message: "Review the portfolio content before publishing.",
    };
  }

  if (!validation.success) {
    return {
      success: false,
      message: "A portfolio theme must be selected before publishing.",
    };
  }

  const adminClient = createAdminClient();
  const { data: selectedTheme, error: selectedThemeError } = await adminClient
    .from("themes")
    .select("id, layout_key, default_config, preview_image_url, is_active")
    .eq("id", validation.data.themeId)
    .maybeSingle();
  const parsedSelectedTheme = ThemeDatabaseMetadataSchema.safeParse(selectedTheme);
  const selectedManifest = parsedSelectedTheme.success
    ? getThemeManifest(parsedSelectedTheme.data.layout_key)
    : null;

  if (selectedThemeError || !parsedSelectedTheme.success || !selectedManifest) {
    return {
      success: false,
      message: "A portfolio theme must be selected before publishing.",
    };
  }

  const { data: matchingThemes, error: matchingThemesError } = await adminClient
    .from("themes")
    .select("id, layout_key, default_config, preview_image_url, is_active")
    .eq("layout_key", selectedManifest.layoutKey);
  const parsedMatchingThemes = (matchingThemes ?? []).flatMap((theme) => {
    const parsed = ThemeDatabaseMetadataSchema.safeParse(theme);
    return parsed.success ? [parsed.data] : [];
  });

  if (
    matchingThemesError ||
    parsedMatchingThemes.length !== (matchingThemes?.length ?? 0) ||
    !isUniqueActiveCodedTheme(parsedMatchingThemes, selectedManifest.layoutKey) ||
    parsedMatchingThemes[0]?.id !== validation.data.themeId
  ) {
    return {
      success: false,
      message: "A portfolio theme must be selected before publishing.",
    };
  }

  const { data: publication, error: publicationError } = await supabase
    .rpc("publish_portfolio", {
      p_draft_content: toDatabaseJson(validation.data.draftContent),
      p_portfolio_id: parsedId.data,
      p_theme_config: toDatabaseJson(validation.data.themeConfig),
      p_theme_id: validation.data.themeId,
    })
    .single();

  if (publicationError || !publication) {
    logPortfolioDatabaseError(
      "publish-transaction",
      publicationError,
      parsedId.data,
    );

    if (publicationError?.message === "theme_required") {
      return {
        success: false,
        message: "A portfolio theme must be selected before publishing.",
      };
    }

    if (publicationError?.message === "portfolio_changed") {
      return {
        success: false,
        message: "The portfolio changed while publishing. Please try again.",
      };
    }

    return {
      success: false,
      message: "The portfolio could not be published. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/deployments");
  revalidatePath(`/p/${publication.portfolio_slug}`);

  return {
    success: true,
    slug: publication.portfolio_slug,
    version: publication.deployment_version,
  };
}
