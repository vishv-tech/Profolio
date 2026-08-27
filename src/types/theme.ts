export interface ThemeConfig {
  appearance: ThemeAppearance;
  sections: ThemeSections;
  visibility: ThemeVisibility;
}

export interface ThemeAppearance {
  colorMode: "light" | "dark";

  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  accentColor: string;
  borderColor: string;

  fontFamily: ThemeFont;
  headingFontFamily: ThemeFont;

  borderRadius: number;

  spacing: "compact" | "comfortable" | "spacious";

  animationIntensity: "none" | "subtle" | "dynamic";
}

export type ThemeFont =
  | "Geist"
  | "Inter"
  | "Roboto"
  | "Poppins"
  | "Montserrat"
  | "Playfair Display"
  | "Source Sans 3"
  | "JetBrains Mono";

export type PortfolioSectionKey =
  | "summary"
  | "experience"
  | "education"
  | "projects"
  | "skills"
  | "achievements"
  | "certifications"
  | "languages"
  | "interests"
  | "customSections";

export interface ThemeSections {
  order: PortfolioSectionKey[];
  hidden: PortfolioSectionKey[];
}

export interface ThemeVisibility {
  showProfileImage: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  showLinks: boolean;
}
