import { z } from "zod";

import type {
  ThemeAppearance,
  ThemeConfig,
  ThemeSections,
  ThemeVisibility,
} from "@/types/theme";

export const ThemeColorSchema = z
  .string()
  .regex(
    /^#(?:[\da-fA-F]{3}|[\da-fA-F]{4}|[\da-fA-F]{6}|[\da-fA-F]{8})$/,
    "Use a hexadecimal color in #RGB, #RGBA, #RRGGBB, or #RRGGBBAA format.",
  );

export const ThemeFontSchema = z.enum([
  "Geist",
  "Inter",
  "Roboto",
  "Poppins",
  "Montserrat",
  "Playfair Display",
  "Source Sans 3",
  "JetBrains Mono",
]);

export const PortfolioSectionKeySchema = z.enum([
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
]);

export const ThemeAppearanceSchema: z.ZodType<ThemeAppearance> =
  z.strictObject({
    colorMode: z.enum(["light", "dark"]),
    backgroundColor: ThemeColorSchema,
    surfaceColor: ThemeColorSchema,
    textColor: ThemeColorSchema,
    mutedTextColor: ThemeColorSchema,
    accentColor: ThemeColorSchema,
    borderColor: ThemeColorSchema,
    fontFamily: ThemeFontSchema,
    headingFontFamily: ThemeFontSchema,
    borderRadius: z.number().finite().min(0).max(48),
    spacing: z.enum(["compact", "comfortable", "spacious"]),
    animationIntensity: z.enum(["none", "subtle", "dynamic"]),
  });

export const ThemeSectionsSchema: z.ZodType<ThemeSections> = z.strictObject({
  order: z.array(PortfolioSectionKeySchema),
  hidden: z.array(PortfolioSectionKeySchema),
});

export const ThemeVisibilitySchema: z.ZodType<ThemeVisibility> =
  z.strictObject({
    showProfileImage: z.boolean(),
    showEmail: z.boolean(),
    showPhone: z.boolean(),
    showLocation: z.boolean(),
    showLinks: z.boolean(),
  });

export const ThemeConfigSchema: z.ZodType<ThemeConfig> = z.strictObject({
  appearance: ThemeAppearanceSchema,
  sections: ThemeSectionsSchema,
  visibility: ThemeVisibilitySchema,
});
