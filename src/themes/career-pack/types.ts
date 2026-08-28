import type { ComponentType } from "react";

import type { PortfolioData } from "@/types/portfolio";
import type { ThemeConfig } from "@/types/theme";

export const THEME_CATEGORIES = [
  "All",
  "Professional",
  "Creative",
  "Technology",
  "Engineering",
  "Finance",
  "Legal",
  "Healthcare",
  "Design",
  "Business",
  "Experimental",
] as const;

export type ThemeCategory = (typeof THEME_CATEGORIES)[number];

export type CareerThemeLayoutKey =
  | "career-content-creator"
  | "career-mechanical-engineer"
  | "career-electrical-engineer"
  | "career-finance-ca"
  | "career-legal-professional"
  | "career-architect-designer"
  | "career-healthcare-professional"
  | "career-ai-data"
  | "career-product-designer"
  | "career-business-consulting";

export interface ThemeComponentProps {
  data: PortfolioData;
  config: ThemeConfig;
}

export type ThemeComponent = ComponentType<ThemeComponentProps>;

export interface ThemeComponentModule {
  default: ThemeComponent;
}

export interface ThemeManifest<TLayoutKey extends string = string> {
  layoutKey: TLayoutKey;
  name: string;
  description: string;
  category: ThemeCategory;
  careerTags: readonly string[];
  styleTags: readonly string[];
  previewImage?: string;
  component: () => Promise<ThemeComponentModule>;
}

export type CareerThemeManifest = ThemeManifest<CareerThemeLayoutKey>;

export function defineCareerTheme(
  manifest: CareerThemeManifest,
): CareerThemeManifest {
  return Object.freeze({
    ...manifest,
    careerTags: Object.freeze([...manifest.careerTags]),
    styleTags: Object.freeze([...manifest.styleTags]),
  });
}
