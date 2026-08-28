import type { PortfolioData } from "@/types/portfolio";
import type { PortfolioSectionKey, ThemeConfig } from "@/types/theme";

export const SECTION_LABELS: Readonly<Record<PortfolioSectionKey, string>> = {
  summary: "Profile",
  experience: "Experience",
  education: "Education",
  projects: "Projects",
  skills: "Skills",
  achievements: "Achievements",
  certifications: "Certifications",
  languages: "Languages",
  interests: "Interests",
  customSections: "More",
};

export const DEFAULT_SECTION_ORDER = Object.freeze([
  "summary",
  "experience",
  "projects",
  "skills",
  "education",
  "achievements",
  "certifications",
  "languages",
  "interests",
  "customSections",
] satisfies PortfolioSectionKey[]);

export function hasThemeSectionContent(
  data: PortfolioData,
  sectionKey: PortfolioSectionKey,
): boolean {
  if (sectionKey === "summary") {
    return Boolean(data.summary.trim());
  }

  return data[sectionKey].length > 0;
}

export function getVisibleThemeSections(
  data: PortfolioData,
  config: ThemeConfig,
): PortfolioSectionKey[] {
  const hidden = new Set(config.sections.hidden);
  const ordered = [...config.sections.order, ...DEFAULT_SECTION_ORDER];

  return ordered.filter(
    (sectionKey, index) =>
      ordered.indexOf(sectionKey) === index &&
      !hidden.has(sectionKey) &&
      hasThemeSectionContent(data, sectionKey),
  );
}

export function getThemeInitials(fullName: string): string {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "P";
}
