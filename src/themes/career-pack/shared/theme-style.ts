import type { CSSProperties } from "react";

import type { ThemeConfig } from "@/types/theme";

import { getThemeFontStack } from "./fonts";

export type CareerThemeStyle = CSSProperties & {
  "--border": string;
  "--career-accent": string;
  "--career-background": string;
  "--career-border": string;
  "--career-heading-font": string;
  "--career-muted": string;
  "--career-radius": string;
  "--career-section-gap": string;
  "--career-surface": string;
  "--career-text": string;
};

const SECTION_GAPS = {
  compact: "1rem",
  comfortable: "1.5rem",
  spacious: "2.25rem",
} as const;

export function getCareerThemeStyle(config: ThemeConfig): CareerThemeStyle {
  const { appearance } = config;

  return {
    "--border": appearance.borderColor,
    "--career-accent": appearance.accentColor,
    "--career-background": appearance.backgroundColor,
    "--career-border": appearance.borderColor,
    "--career-heading-font": getThemeFontStack(appearance.headingFontFamily),
    "--career-muted": appearance.mutedTextColor,
    "--career-radius": `${appearance.borderRadius}px`,
    "--career-section-gap": SECTION_GAPS[appearance.spacing],
    "--career-surface": appearance.surfaceColor,
    "--career-text": appearance.textColor,
    backgroundColor: appearance.backgroundColor,
    color: appearance.textColor,
    colorScheme: appearance.colorMode,
    fontFamily: getThemeFontStack(appearance.fontFamily),
  };
}
