import { ThemeConfigSchema } from "@/lib/validation/theme";
import type { ThemeConfig } from "@/types/theme";

export const defaultThemeConfig: ThemeConfig = Object.freeze({
  appearance: {
    colorMode: "light",
    backgroundColor: "#ffffff",
    surfaceColor: "#f8fafc",
    textColor: "#0f172a",
    mutedTextColor: "#64748b",
    accentColor: "#2563eb",
    borderColor: "#e2e8f0",
    fontFamily: "Geist",
    headingFontFamily: "Geist",
    headingScale: "medium",
    borderRadius: 12,
    spacing: "comfortable",
    animationIntensity: "subtle",
  },
  sections: {
    order: [
      "summary",
      "experience",
      "education",
      "projects",
      "skills",
      "achievements",
      "certifications",
      "languages",
      "interests",
      "customSections",
    ],
    hidden: [],
  },
  visibility: {
    showProfileImage: true,
    showEmail: true,
    showPhone: true,
    showLocation: true,
    showLinks: true,
  },
} satisfies ThemeConfig);

type ConfigRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ConfigRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickKnownValues<T extends object>(defaults: T, value: unknown): T {
  if (!isRecord(value)) {
    return { ...defaults };
  }

  return Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => [
      key,
      value[key] === undefined ? fallback : value[key],
    ]),
  ) as T;
}

function cloneDefaultThemeConfig(): ThemeConfig {
  return {
    appearance: { ...defaultThemeConfig.appearance },
    sections: {
      order: [...defaultThemeConfig.sections.order],
      hidden: [...defaultThemeConfig.sections.hidden],
    },
    visibility: { ...defaultThemeConfig.visibility },
  };
}

export function resolveThemeConfig(value: unknown): ThemeConfig {
  const completeConfig = ThemeConfigSchema.safeParse(value);

  if (completeConfig.success) {
    return completeConfig.data;
  }

  const config = isRecord(value) ? value : {};
  const merged = ThemeConfigSchema.safeParse({
    appearance: pickKnownValues(
      defaultThemeConfig.appearance,
      config.appearance,
    ),
    sections: pickKnownValues(defaultThemeConfig.sections, config.sections),
    visibility: pickKnownValues(
      defaultThemeConfig.visibility,
      config.visibility,
    ),
    ...(config.styleOverrides === undefined
      ? {}
      : { styleOverrides: config.styleOverrides }),
  });

  return merged.success ? merged.data : cloneDefaultThemeConfig();
}
