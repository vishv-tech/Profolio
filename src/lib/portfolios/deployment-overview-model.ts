import { z } from "zod";

import { PortfolioSlugSchema } from "@/lib/portfolios/contracts";
import { getThemeManifest } from "@/themes/registry";

export const DeploymentOverviewPortfolioRowSchema = z.strictObject({
  id: z.string().uuid(),
  title: z.string().trim().min(1),
  slug: PortfolioSlugSchema,
  status: z.enum(["draft", "published", "private"]),
  published_at: z.string().nullable(),
});

export const CurrentDeploymentRowSchema = z.strictObject({
  id: z.string().uuid(),
  portfolio_id: z.string().uuid(),
  version: z.number().int().positive(),
  status: z.enum(["current", "historical", "rolled_back"]),
  theme_id: z.string().uuid(),
  created_at: z.string(),
});

export const DeploymentThemeRowSchema = z.strictObject({
  id: z.string().uuid(),
  name: z.string().trim().min(1),
  layout_key: z.string().trim().min(1),
});

export type DeploymentOverview = {
  portfolio: {
    id: string;
    title: string;
    slug: string;
    status: "published";
    publishedAt: string;
    publicPath: string;
  };
  deployment: {
    id: string;
    version: number;
    status: "current";
    createdAt: string;
  };
  theme: {
    id: string;
    layoutKey: string;
    name: string;
  };
};

export type DeploymentOverviewResult =
  | { status: "unavailable" }
  | {
      status: "unpublished";
      portfolio: {
        id: string;
        title: string;
        slug: string;
        status: "draft" | "private";
      };
    }
  | { status: "ready"; overview: DeploymentOverview };

export function buildDeploymentOverview({
  deployment,
  portfolio,
  theme,
}: {
  deployment: unknown;
  portfolio: unknown;
  theme: unknown;
}): DeploymentOverviewResult {
  const parsedPortfolio = DeploymentOverviewPortfolioRowSchema.safeParse(portfolio);

  if (!parsedPortfolio.success) {
    return { status: "unavailable" };
  }

  if (
    parsedPortfolio.data.status !== "published" ||
    !parsedPortfolio.data.published_at
  ) {
    return {
      status: "unpublished",
      portfolio: {
        id: parsedPortfolio.data.id,
        title: parsedPortfolio.data.title,
        slug: parsedPortfolio.data.slug,
        status:
          parsedPortfolio.data.status === "private"
            ? "private"
            : "draft",
      },
    };
  }

  const parsedDeployment = CurrentDeploymentRowSchema.safeParse(deployment);
  const parsedTheme = DeploymentThemeRowSchema.safeParse(theme);

  if (
    !parsedDeployment.success ||
    !parsedTheme.success ||
    parsedDeployment.data.portfolio_id !== parsedPortfolio.data.id ||
    parsedDeployment.data.status !== "current" ||
    parsedDeployment.data.theme_id !== parsedTheme.data.id
  ) {
    return { status: "unavailable" };
  }

  const manifest = getThemeManifest(parsedTheme.data.layout_key);

  if (!manifest) {
    return { status: "unavailable" };
  }

  return {
    status: "ready",
    overview: {
      portfolio: {
        id: parsedPortfolio.data.id,
        title: parsedPortfolio.data.title,
        slug: parsedPortfolio.data.slug,
        status: "published",
        publishedAt: parsedPortfolio.data.published_at,
        publicPath: `/p/${parsedPortfolio.data.slug}`,
      },
      deployment: {
        id: parsedDeployment.data.id,
        version: parsedDeployment.data.version,
        status: "current",
        createdAt: parsedDeployment.data.created_at,
      },
      theme: {
        id: parsedTheme.data.id,
        layoutKey: manifest.layoutKey,
        name: manifest.name,
      },
    },
  };
}
