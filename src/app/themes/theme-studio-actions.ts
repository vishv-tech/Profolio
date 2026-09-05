"use server";

import { revalidatePath } from "next/cache";

import { requireActiveUser } from "@/lib/auth/guards";
import { PortfolioIdSchema } from "@/lib/portfolios/contracts";
import { logPortfolioDatabaseError } from "@/lib/portfolios/database-errors";
import { toDatabaseJson } from "@/lib/resumes/json";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  applyThemeStylePatch,
  describeThemeStylePatch,
  replaceThemeStyleOverrides,
  themeConfigsEqual,
} from "@/lib/theme-ai/patch";
import {
  getEffectiveThemeAppearance,
  isAiThemeEngineSupported,
} from "@/lib/theme-ai/capabilities";
import {
  THEME_AI_RESPONSE_JSON_SCHEMA,
  ThemeStudioInstructionSchema,
} from "@/lib/theme-ai/schema";
import { generateStructuredThemeStyle } from "@/lib/theme-ai/gemini";
import { generateThemeStyleInterpretation } from "@/lib/theme-ai/service";
import { isUniqueActiveCodedTheme } from "@/lib/themes/metadata";
import { ThemeDatabaseMetadataSchema } from "@/lib/themes/store";
import {
  ThemeConfigSchema,
  ThemeStyleOverridesSchema,
} from "@/lib/validation/theme";
import { getThemeManifest } from "@/themes/registry";
import type { ThemeConfig, ThemeStyleOverrides } from "@/types/theme";

const THEME_STUDIO_UNAVAILABLE_MESSAGE =
  "AI Theme Engine is temporarily unavailable. Your current theme has not been changed.";
const THEME_ENGINE_THEME_UNSUPPORTED_MESSAGE =
  "AI customization is currently available for selected themes.";
const THEME_STUDIO_UNSUPPORTED_MESSAGE =
  "I can customize your portfolio’s visual design here. Content changes belong in the portfolio editor, and publishing uses the existing Publish button.";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type OwnedThemeState = {
  config: ThemeConfig;
  themeId: string;
  updatedAt: string;
};

type ThemeStudioFailure = {
  success: false;
  message: string;
  reason: "ai" | "invalid" | "stale" | "unavailable";
};

export type ThemeStudioActionResult =
  | ThemeStudioFailure
  | {
      success: true;
      applied: boolean;
      message: string;
      themeConfig: ThemeConfig;
    };

async function loadOwnedThemeState(
  supabase: ServerSupabaseClient,
  portfolioId: string,
  userId: string,
  layoutKey: string,
): Promise<OwnedThemeState | null> {
  const manifest = getThemeManifest(layoutKey);
  if (!manifest || !isAiThemeEngineSupported(manifest.layoutKey)) return null;

  const portfolioResult = await supabase
    .from("portfolios")
    .select("id, theme_id, theme_config, updated_at")
    .eq("id", portfolioId)
    .eq("user_id", userId)
    .maybeSingle();

  if (portfolioResult.error || !portfolioResult.data?.theme_id) {
    logPortfolioDatabaseError(
      "theme-studio-read",
      portfolioResult.error,
    );
    return null;
  }

  const config = ThemeConfigSchema.safeParse(portfolioResult.data.theme_config);
  if (!config.success) return null;

  const metadataResult = await createAdminClient()
    .from("themes")
    .select("id, layout_key, default_config, preview_image_url, is_active")
    .eq("layout_key", manifest.layoutKey);
  const parsedThemes = (metadataResult.data ?? []).flatMap((theme) => {
    const parsed = ThemeDatabaseMetadataSchema.safeParse(theme);
    return parsed.success ? [parsed.data] : [];
  });
  const selectedTheme = parsedThemes[0];

  if (
    metadataResult.error ||
    parsedThemes.length !== (metadataResult.data?.length ?? 0) ||
    !isUniqueActiveCodedTheme(parsedThemes, manifest.layoutKey) ||
    selectedTheme?.id !== portfolioResult.data.theme_id
  ) {
    logPortfolioDatabaseError(
      "theme-studio-metadata",
      metadataResult.error,
    );
    return null;
  }

  return {
    config: config.data,
    themeId: selectedTheme.id,
    updatedAt: portfolioResult.data.updated_at,
  };
}

async function persistThemeConfig(
  supabase: ServerSupabaseClient,
  input: {
    config: ThemeConfig;
    portfolioId: string;
    themeId: string;
    updatedAt: string;
    userId: string;
  },
): Promise<ThemeConfig | "stale" | null> {
  const result = await supabase
    .from("portfolios")
    .update({ theme_config: toDatabaseJson(input.config) })
    .eq("id", input.portfolioId)
    .eq("user_id", input.userId)
    .eq("theme_id", input.themeId)
    .eq("updated_at", input.updatedAt)
    .select("id, theme_config")
    .maybeSingle();

  if (result.error) {
    logPortfolioDatabaseError(
      "theme-studio-update",
      result.error,
    );
    return null;
  }

  if (!result.data) return "stale";

  const saved = ThemeConfigSchema.safeParse(result.data.theme_config);
  if (!saved.success) return null;

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/themes");
  revalidatePath("/dashboard/export");

  return saved.data;
}

function invalidThemeStudioResult(): ThemeStudioFailure {
  return {
    success: false,
    message: "That saved theme is unavailable.",
    reason: "unavailable",
  };
}

export async function customizePortfolioTheme(
  portfolioIdValue: unknown,
  layoutKeyValue: unknown,
  instructionValue: unknown,
  expectedConfigValue: unknown,
): Promise<ThemeStudioActionResult> {
  const user = await requireActiveUser();
  const portfolioId = PortfolioIdSchema.safeParse(portfolioIdValue);
  const layoutKey =
    typeof layoutKeyValue === "string"
      ? getThemeManifest(layoutKeyValue)?.layoutKey ?? null
      : null;
  const instruction = ThemeStudioInstructionSchema.safeParse(instructionValue);
  const expectedConfig = ThemeConfigSchema.safeParse(expectedConfigValue);

  if (
    !portfolioId.success ||
    !layoutKey ||
    !isAiThemeEngineSupported(layoutKey) ||
    !instruction.success ||
    !expectedConfig.success
  ) {
    return {
      success: false,
      message:
        layoutKey && !isAiThemeEngineSupported(layoutKey)
          ? THEME_ENGINE_THEME_UNSUPPORTED_MESSAGE
          : "Describe one visual change in 500 characters or fewer.",
      reason: "invalid",
    };
  }

  const supabase = await createClient();
  const state = await loadOwnedThemeState(
    supabase,
    portfolioId.data,
    user.userId,
    layoutKey,
  );

  if (!state) return invalidThemeStudioResult();

  if (!themeConfigsEqual(state.config, expectedConfig.data)) {
    return {
      success: false,
      message: "This theme changed elsewhere. Reopen the preview and try again.",
      reason: "stale",
    };
  }

  try {
    const interpretation = await generateThemeStyleInterpretation(
      {
        currentAppearance: getEffectiveThemeAppearance(state.config, layoutKey),
        instruction: instruction.data,
        layoutKey,
        themeName: getThemeManifest(layoutKey)?.name ?? "Selected theme",
      },
      generateStructuredThemeStyle,
      THEME_AI_RESPONSE_JSON_SCHEMA,
    );

    if (!interpretation) {
      return {
        success: false,
        message: THEME_STUDIO_UNAVAILABLE_MESSAGE,
        reason: "ai",
      };
    }

    if (interpretation.kind === "unsupported") {
      return {
        success: true,
        applied: false,
        message: THEME_STUDIO_UNSUPPORTED_MESSAGE,
        themeConfig: state.config,
      };
    }

    const nextConfig = applyThemeStylePatch(
      state.config,
      interpretation.patch,
    );
    if (!nextConfig) {
      return {
        success: false,
        message: THEME_STUDIO_UNAVAILABLE_MESSAGE,
        reason: "ai",
      };
    }

    if (themeConfigsEqual(nextConfig, state.config)) {
      return {
        success: true,
        applied: false,
        message: "This theme already matches that visual request.",
        themeConfig: state.config,
      };
    }

    const saved = await persistThemeConfig(supabase, {
      config: nextConfig,
      portfolioId: portfolioId.data,
      themeId: state.themeId,
      updatedAt: state.updatedAt,
      userId: user.userId,
    });

    if (saved === "stale") {
      return {
        success: false,
        message: "This theme changed elsewhere. Reopen the preview and try again.",
        reason: "stale",
      };
    }

    if (!saved) {
      return {
        success: false,
        message: THEME_STUDIO_UNAVAILABLE_MESSAGE,
        reason: "unavailable",
      };
    }

    return {
      success: true,
      applied: true,
      message: describeThemeStylePatch(interpretation.patch),
      themeConfig: saved,
    };
  } catch {
    return {
      success: false,
      message: THEME_STUDIO_UNAVAILABLE_MESSAGE,
      reason: "ai",
    };
  }
}

async function persistReplacementStyleOverrides(
  portfolioIdValue: unknown,
  layoutKeyValue: unknown,
  expectedConfigValue: unknown,
  replacementStyleOverridesValue: unknown,
): Promise<ThemeStudioActionResult> {
  const user = await requireActiveUser();
  const portfolioId = PortfolioIdSchema.safeParse(portfolioIdValue);
  const layoutKey =
    typeof layoutKeyValue === "string"
      ? getThemeManifest(layoutKeyValue)?.layoutKey ?? null
      : null;
  const expectedConfig = ThemeConfigSchema.safeParse(expectedConfigValue);
  const replacementStyleOverrides =
    replacementStyleOverridesValue === null
      ? { success: true as const, data: null }
      : ThemeStyleOverridesSchema.safeParse(replacementStyleOverridesValue);

  if (
    !portfolioId.success ||
    !layoutKey ||
    !isAiThemeEngineSupported(layoutKey) ||
    !expectedConfig.success ||
    !replacementStyleOverrides.success
  ) {
    return invalidThemeStudioResult();
  }

  const supabase = await createClient();
  const state = await loadOwnedThemeState(
    supabase,
    portfolioId.data,
    user.userId,
    layoutKey,
  );

  if (!state) return invalidThemeStudioResult();

  if (!themeConfigsEqual(state.config, expectedConfig.data)) {
    return {
      success: false,
      message: "This theme changed elsewhere. Reopen the preview and try again.",
      reason: "stale",
    };
  }

  const nextConfig = replaceThemeStyleOverrides(
    state.config,
    replacementStyleOverrides.data,
  );
  if (!nextConfig) return invalidThemeStudioResult();

  const saved = await persistThemeConfig(supabase, {
    config: nextConfig,
    portfolioId: portfolioId.data,
    themeId: state.themeId,
    updatedAt: state.updatedAt,
    userId: user.userId,
  });

  if (saved === "stale") {
    return {
      success: false,
      message: "This theme changed elsewhere. Reopen the preview and try again.",
      reason: "stale",
    };
  }

  return saved
    ? {
        success: true,
        applied: true,
        message: "The previous visual style has been restored.",
        themeConfig: saved,
      }
    : {
        success: false,
        message: THEME_STUDIO_UNAVAILABLE_MESSAGE,
        reason: "unavailable",
      };
}

export async function undoPortfolioThemeCustomization(
  portfolioId: unknown,
  layoutKey: unknown,
  expectedConfig: unknown,
  previousStyleOverrides: ThemeStyleOverrides | null,
): Promise<ThemeStudioActionResult> {
  return persistReplacementStyleOverrides(
    portfolioId,
    layoutKey,
    expectedConfig,
    previousStyleOverrides,
  );
}

export async function resetPortfolioThemeCustomization(
  portfolioIdValue: unknown,
  layoutKeyValue: unknown,
  expectedConfigValue: unknown,
): Promise<ThemeStudioActionResult> {
  const user = await requireActiveUser();
  const portfolioId = PortfolioIdSchema.safeParse(portfolioIdValue);
  const layoutKey =
    typeof layoutKeyValue === "string"
      ? getThemeManifest(layoutKeyValue)?.layoutKey ?? null
      : null;
  const expectedConfig = ThemeConfigSchema.safeParse(expectedConfigValue);

  if (
    !portfolioId.success ||
    !layoutKey ||
    !isAiThemeEngineSupported(layoutKey) ||
    !expectedConfig.success
  ) {
    return invalidThemeStudioResult();
  }

  const supabase = await createClient();
  const state = await loadOwnedThemeState(
    supabase,
    portfolioId.data,
    user.userId,
    layoutKey,
  );

  if (!state) return invalidThemeStudioResult();

  if (!themeConfigsEqual(state.config, expectedConfig.data)) {
    return {
      success: false,
      message: "This theme changed elsewhere. Reopen the preview and try again.",
      reason: "stale",
    };
  }

  const nextConfig = replaceThemeStyleOverrides(state.config, null);
  if (!nextConfig) return invalidThemeStudioResult();

  if (themeConfigsEqual(nextConfig, state.config)) {
    return {
      success: true,
      applied: false,
      message: "This theme is already using its original visual style.",
      themeConfig: state.config,
    };
  }

  const saved = await persistThemeConfig(supabase, {
    config: nextConfig,
    portfolioId: portfolioId.data,
    themeId: state.themeId,
    updatedAt: state.updatedAt,
    userId: user.userId,
  });

  if (saved === "stale") {
    return {
      success: false,
      message: "This theme changed elsewhere. Reopen the preview and try again.",
      reason: "stale",
    };
  }

  return saved
    ? {
        success: true,
        applied: true,
        message: "AI customization has been reset to this theme’s original visual style.",
        themeConfig: saved,
      }
    : {
        success: false,
        message: THEME_STUDIO_UNAVAILABLE_MESSAGE,
        reason: "unavailable",
      };
}
