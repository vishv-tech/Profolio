import { z } from "zod";

import type { PortfolioData } from "@/types/portfolio";
import type { ThemeConfig } from "@/types/theme";

export const PortfolioIdSchema = z.string().uuid();
export const PortfolioSlugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export type PortfolioStatus = "draft" | "published" | "private";

export type PublishPortfolioResult =
  | { success: true; slug: string; version: number }
  | { success: false; message: string };

export type PublishedPortfolio = {
  id: string;
  slug: string;
  title: string;
  publishedContent: PortfolioData;
  themeConfig: ThemeConfig;
  publishedAt: string;
  theme: {
    id: string;
    slug: string;
    name: string;
    layoutKey: string;
  };
};
