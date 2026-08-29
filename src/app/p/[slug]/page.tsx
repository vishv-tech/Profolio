import { notFound } from "next/navigation";

import { getPublishedPortfolioBySlug } from "@/lib/portfolios/queries";
import { loadThemeComponent } from "@/themes";

export default async function PublicPortfolioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const portfolio = await getPublishedPortfolioBySlug(slug);

  if (!portfolio) {
    notFound();
  }

  const Theme = await loadThemeComponent(portfolio.theme.layoutKey);

  if (!Theme) {
    notFound();
  }

  return <Theme config={portfolio.themeConfig} data={portfolio.publishedContent} />;
}
