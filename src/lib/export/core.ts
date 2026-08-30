import { z } from "zod";

import { PortfolioSlugSchema } from "@/lib/portfolios/contracts";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";
import { ThemeConfigSchema } from "@/lib/validation/theme";

export const ExportPortfolioSchema = z.strictObject({
  title: z.string().min(1),
  slug: PortfolioSlugSchema,
  status: z.enum(["draft", "published", "private"]),
  themeName: z.string().min(1),
  layoutKey: z.string().min(1),
  data: PortfolioDataSchema,
  themeConfig: ThemeConfigSchema,
});

export type ExportPortfolio = z.infer<typeof ExportPortfolioSchema>;

export function createPortfolioExport(
  input: unknown,
  exportedAt = new Date(),
) {
  const portfolio = ExportPortfolioSchema.safeParse(input);
  if (!portfolio.success || !Number.isFinite(exportedAt.getTime())) return null;

  return {
    exportVersion: 1 as const,
    exportedAt: exportedAt.toISOString(),
    portfolio: {
      title: portfolio.data.title,
      slug: portfolio.data.slug,
      status: portfolio.data.status,
      theme: {
        name: portfolio.data.themeName,
        layoutKey: portfolio.data.layoutKey,
      },
    },
    portfolioData: portfolio.data.data,
    themeConfig: portfolio.data.themeConfig,
  };
}

export function portfolioExportFilename(title: string): string {
  const safeTitle = title
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

  return `${safeTitle || "portfolio"}-portfolio.json`;
}

export function serializePortfolioExport(
  portfolio: unknown,
  exportedAt = new Date(),
): string | null {
  const value = createPortfolioExport(portfolio, exportedAt);
  return value ? `${JSON.stringify(value, null, 2)}\n` : null;
}
