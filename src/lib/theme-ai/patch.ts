import {
  ThemeConfigSchema,
  ThemeStyleOverridesSchema,
} from "@/lib/validation/theme";
import type { ThemeAppearance, ThemeConfig } from "@/types/theme";

import {
  normalizeThemeStylePatch,
  ThemeStylePatchSchema,
  type ThemeStylePatch,
} from "./schema";

export function applyThemeStylePatch(
  configValue: unknown,
  patchValue: unknown,
): ThemeConfig | null {
  const config = ThemeConfigSchema.safeParse(configValue);
  const patch = ThemeStylePatchSchema.safeParse(patchValue);

  if (!config.success || !patch.success) {
    return null;
  }

  const result = ThemeConfigSchema.safeParse({
    ...config.data,
    styleOverrides: {
      ...config.data.styleOverrides,
      ...normalizeThemeStylePatch(patch.data),
    },
  });

  return result.success ? result.data : null;
}

export function replaceThemeStyleOverrides(
  configValue: unknown,
  overridesValue: unknown,
): ThemeConfig | null {
  const config = ThemeConfigSchema.safeParse(configValue);
  const overrides =
    overridesValue === null
      ? { success: true as const, data: null }
      : ThemeStyleOverridesSchema.safeParse(overridesValue);

  if (!config.success || !overrides.success) {
    return null;
  }

  const nextConfig: ThemeConfig = {
    ...config.data,
  };

  if (overrides.data && Object.keys(overrides.data).length > 0) {
    nextConfig.styleOverrides = overrides.data;
  } else {
    delete nextConfig.styleOverrides;
  }

  return nextConfig;
}

export function themeConfigsEqual(
  leftValue: unknown,
  rightValue: unknown,
): boolean {
  const left = ThemeConfigSchema.safeParse(leftValue);
  const right = ThemeConfigSchema.safeParse(rightValue);

  return Boolean(
    left.success &&
      right.success &&
      JSON.stringify(left.data) === JSON.stringify(right.data),
  );
}

const PATCH_LABELS: Readonly<Record<keyof ThemeStylePatch, string>> = {
  colorMode: "color mode",
  backgroundColor: "background",
  surfaceColor: "card surfaces",
  textColor: "text color",
  mutedTextColor: "secondary text",
  accentColor: "accent color",
  borderColor: "borders",
  fontFamily: "body font",
  headingFontFamily: "heading font",
  headingScale: "heading size",
  borderRadius: "corner radius",
  spacing: "spacing",
  animationIntensity: "motion",
};

export function describeThemeStylePatch(patch: ThemeStylePatch): string {
  const labels = Object.keys(patch).map(
    (key) => PATCH_LABELS[key as keyof ThemeStylePatch],
  );
  const summary =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;

  return `Done — I updated the ${summary}.`;
}

export function withDefaultHeadingScale(
  appearance: ThemeAppearance,
): ThemeAppearance {
  return {
    ...appearance,
    headingScale: appearance.headingScale ?? "medium",
  };
}
