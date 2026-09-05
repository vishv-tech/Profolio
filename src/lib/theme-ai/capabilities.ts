import type {
  ThemeAppearance,
  ThemeConfig,
  ThemeStyleOverrides,
} from "@/types/theme";

/**
 * Product capability contract. Keep this explicit: picker order may change,
 * but AI Theme Engine availability must remain tied to these ten stable keys.
 */
export const AI_THEME_ENGINE_LAYOUT_KEYS = Object.freeze([
  "pavni-professional-editorial",
  "pavni-modern-professional",
  "pavni-dynamic-bento",
  "pavni-creative-developer",
  "pavni-brown-red-scrapbook",
  "pavni-black-blue-startup",
  "pavni-webverse-collage",
  "pavni-illustrated-desk",
  "pavni-retro-desktop",
  "pavni-kinetic-gallery",
] as const);

export type AiThemeEngineLayoutKey =
  (typeof AI_THEME_ENGINE_LAYOUT_KEYS)[number];

const AI_THEME_ENGINE_LAYOUT_KEY_SET = new Set<string>(
  AI_THEME_ENGINE_LAYOUT_KEYS,
);

export function isAiThemeEngineSupported(
  layoutKey: string,
): layoutKey is AiThemeEngineLayoutKey {
  return AI_THEME_ENGINE_LAYOUT_KEY_SET.has(layoutKey);
}

export function hasThemeStyleOverrides(config: ThemeConfig): boolean {
  return Boolean(
    config.styleOverrides && Object.keys(config.styleOverrides).length > 0,
  );
}

export function getEffectiveThemeAppearance(
  config: ThemeConfig,
  layoutKey: string,
): ThemeAppearance {
  if (!isAiThemeEngineSupported(layoutKey) || !hasThemeStyleOverrides(config)) {
    return config.appearance;
  }

  return {
    ...config.appearance,
    ...config.styleOverrides,
  };
}

export function getThemeStyleOverrides(
  config: ThemeConfig,
): ThemeStyleOverrides | null {
  return hasThemeStyleOverrides(config) ? { ...config.styleOverrides } : null;
}
