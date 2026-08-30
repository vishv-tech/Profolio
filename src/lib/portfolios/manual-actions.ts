"use server";

import { revalidatePath } from "next/cache";

import { requireActiveUser } from "@/lib/auth/guards";
import { createEmptyPortfolioData } from "@/lib/portfolios/defaults";
import { createPortfolioDraft } from "@/lib/portfolios/mutations";
import { createPortfolioSlugBase } from "@/lib/portfolios/slug";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";

export type CreateManualPortfolioResult =
  | { success: true; created: boolean; portfolioId: string }
  | { success: false; message: string };

export async function createManualPortfolio(): Promise<CreateManualPortfolioResult> {
  const user = await requireActiveUser();
  const content = PortfolioDataSchema.parse(createEmptyPortfolioData());
  const title = user.profile.full_name?.trim() || "Portfolio";
  const slugBase = createPortfolioSlugBase(
    user.profile.username,
    user.profile.full_name,
  );
  const portfolio = await createPortfolioDraft({
    content,
    slugBase,
    source: "manual",
    title,
    userId: user.userId,
  });

  if (!portfolio) {
    return {
      success: false,
      message: "The portfolio could not be created. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/editor");
  revalidatePath("/themes");

  return {
    success: true,
    created: portfolio.created,
    portfolioId: portfolio.portfolioId,
  };
}
