import { PortfolioDataSchema } from "@/lib/validation/portfolio";
import { ThemeConfigSchema } from "@/lib/validation/theme";

export type PortfolioPublicationValidation =
  | {
      success: true;
      data: {
        draftContent: ReturnType<typeof PortfolioDataSchema.parse>;
        themeConfig: ReturnType<typeof ThemeConfigSchema.parse>;
        themeId: string;
      };
    }
  | { success: false; reason: "invalid-content" | "theme-required" };

export function validatePortfolioPublication(
  draftContentValue: unknown,
  themeId: string | null,
  themeConfigValue: unknown,
): PortfolioPublicationValidation {
  const draftContent = PortfolioDataSchema.safeParse(draftContentValue);

  if (!draftContent.success) {
    return { success: false, reason: "invalid-content" };
  }

  const themeConfig = ThemeConfigSchema.safeParse(themeConfigValue);

  if (!themeId || !themeConfig.success) {
    return { success: false, reason: "theme-required" };
  }

  return {
    success: true,
    data: {
      draftContent: draftContent.data,
      themeConfig: themeConfig.data,
      themeId,
    },
  };
}
