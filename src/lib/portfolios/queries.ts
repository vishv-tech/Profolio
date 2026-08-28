import "server-only";

import { z } from "zod";

import {
  PortfolioSlugSchema,
  type PublishedPortfolio,
} from "@/lib/portfolios/contracts";
import { logPortfolioDatabaseError } from "@/lib/portfolios/database-errors";
import { createClient } from "@/lib/supabase/server";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";
import { ThemeConfigSchema } from "@/lib/validation/theme";

const PublishedPortfolioRowSchema = z.strictObject({
  portfolio_id: z.string().uuid(),
  portfolio_slug: PortfolioSlugSchema,
  portfolio_title: z.string().min(1),
  published_content: PortfolioDataSchema,
  theme_id: z.string().uuid(),
  theme_config: ThemeConfigSchema,
  published_at: z.string(),
  theme_slug: z.string(),
  theme_name: z.string(),
  theme_layout_key: z.string(),
});

export async function getPublishedPortfolioBySlug(
  slug: string,
): Promise<PublishedPortfolio | null> {
  const parsedSlug = PortfolioSlugSchema.safeParse(slug);

  if (!parsedSlug.success) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("get_published_portfolio", { p_slug: parsedSlug.data })
    .maybeSingle();

  if (error) {
    logPortfolioDatabaseError("public-fetch", error);
    return null;
  }

  const row = PublishedPortfolioRowSchema.safeParse(data);

  if (!row.success) {
    return null;
  }

  return {
    id: row.data.portfolio_id,
    slug: row.data.portfolio_slug,
    title: row.data.portfolio_title,
    publishedContent: row.data.published_content,
    themeConfig: row.data.theme_config,
    publishedAt: row.data.published_at,
    theme: {
      id: row.data.theme_id,
      slug: row.data.theme_slug,
      name: row.data.theme_name,
      layoutKey: row.data.theme_layout_key,
    },
  };
}
