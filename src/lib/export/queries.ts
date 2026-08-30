import "server-only";

import { z } from "zod";

import { type ExportPortfolio, ExportPortfolioSchema } from "@/lib/export/core";
import { PortfolioIdSchema, PortfolioSlugSchema } from "@/lib/portfolios/contracts";
import { createClient } from "@/lib/supabase/server";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";
import { ThemeConfigSchema } from "@/lib/validation/theme";

const PortfolioChoiceSchema = z.strictObject({
  id: z.string().uuid(),
  title: z.string().min(1),
  slug: PortfolioSlugSchema,
  status: z.enum(["draft", "published", "private"]),
});

const OwnedPortfolioRowSchema = PortfolioChoiceSchema.extend({
  draft_content: PortfolioDataSchema,
  theme_id: z.string().uuid().nullable(),
  theme_config: ThemeConfigSchema,
});

const ThemeRowSchema = z.strictObject({
  id: z.string().uuid(),
  name: z.string().min(1),
  layout_key: z.string().min(1),
});

export type ExportPortfolioChoice = z.infer<typeof PortfolioChoiceSchema>;

export type ExportLoadResult =
  | { status: "unavailable" }
  | { status: "invalid-content" }
  | { status: "theme-required" }
  | { status: "ready"; portfolio: ExportPortfolio };

export type ExportWorkspaceResult =
  | { status: "empty" }
  | { status: "error" }
  | { status: "unavailable"; portfolios: ExportPortfolioChoice[] }
  | {
      status: "selected";
      portfolios: ExportPortfolioChoice[];
      selection: ExportLoadResult;
      selectedId: string;
    };

export async function getOwnedPortfolioForExport(
  portfolioId: string,
  userId: string,
): Promise<ExportLoadResult> {
  const parsedId = PortfolioIdSchema.safeParse(portfolioId);
  if (!parsedId.success) return { status: "unavailable" };

  const supabase = await createClient();
  const portfolioResult = await supabase
    .from("portfolios")
    .select("id, title, slug, status, draft_content, theme_id, theme_config")
    .eq("id", parsedId.data)
    .eq("user_id", userId)
    .maybeSingle();

  if (portfolioResult.error || !portfolioResult.data) {
    return { status: "unavailable" };
  }

  const portfolio = OwnedPortfolioRowSchema.safeParse(portfolioResult.data);
  if (!portfolio.success) return { status: "invalid-content" };
  if (!portfolio.data.theme_id) return { status: "theme-required" };

  const themeResult = await supabase
    .from("themes")
    .select("id, name, layout_key")
    .eq("id", portfolio.data.theme_id)
    .maybeSingle();
  const theme = ThemeRowSchema.safeParse(themeResult.data);
  if (themeResult.error || !theme.success) return { status: "theme-required" };

  const exportPortfolio = ExportPortfolioSchema.safeParse({
    title: portfolio.data.title,
    slug: portfolio.data.slug,
    status: portfolio.data.status,
    themeName: theme.data.name,
    layoutKey: theme.data.layout_key,
    data: portfolio.data.draft_content,
    themeConfig: portfolio.data.theme_config,
  });

  return exportPortfolio.success
    ? { status: "ready", portfolio: exportPortfolio.data }
    : { status: "invalid-content" };
}

export async function getExportWorkspace(
  userId: string,
  requestedPortfolioId: string | null,
): Promise<ExportWorkspaceResult> {
  const supabase = await createClient();
  const result = await supabase
    .from("portfolios")
    .select("id, title, slug, status")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (result.error) return { status: "error" };

  const portfolios = (result.data ?? []).flatMap((row) => {
    const parsed = PortfolioChoiceSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
  if (portfolios.length === 0) return { status: "empty" };

  const selectedId = requestedPortfolioId ?? portfolios[0].id;
  const requestedId = PortfolioIdSchema.safeParse(selectedId);
  if (
    !requestedId.success ||
    !portfolios.some(({ id }) => id === requestedId.data)
  ) {
    return { status: "unavailable", portfolios };
  }

  return {
    status: "selected",
    portfolios,
    selection: await getOwnedPortfolioForExport(requestedId.data, userId),
    selectedId: requestedId.data,
  };
}
