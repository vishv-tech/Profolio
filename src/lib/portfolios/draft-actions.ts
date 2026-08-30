"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireActiveUser } from "@/lib/auth/guards";
import { PortfolioIdSchema } from "@/lib/portfolios/contracts";
import { logPortfolioDatabaseError } from "@/lib/portfolios/database-errors";
import { toDatabaseJson } from "@/lib/resumes/json";
import { MAX_PORTFOLIO_JSON_BYTES } from "@/lib/resumes/validation";
import { createClient } from "@/lib/supabase/server";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";
import type { PortfolioData } from "@/types/portfolio";

const UpdatedAtSchema = z.string().min(1).max(100);

export type SavePortfolioDraftResult =
  | { success: true; content: PortfolioData; updatedAt: string }
  | { success: false; message: string; reason: "invalid" | "unavailable" | "stale" };

export async function savePortfolioDraft(
  portfolioId: string,
  expectedUpdatedAt: string,
  contentValue: unknown,
): Promise<SavePortfolioDraftResult> {
  const user = await requireActiveUser();
  const parsedId = PortfolioIdSchema.safeParse(portfolioId);
  const updatedAt = UpdatedAtSchema.safeParse(expectedUpdatedAt);
  const content = PortfolioDataSchema.safeParse(contentValue);

  if (!parsedId.success || !updatedAt.success || !content.success) {
    return {
      success: false,
      message: "Review the portfolio fields and try saving again.",
      reason: "invalid",
    };
  }

  const serialized = JSON.stringify(content.data);
  if (new TextEncoder().encode(serialized).length > MAX_PORTFOLIO_JSON_BYTES) {
    return { success: false, message: "This portfolio is too large to save.", reason: "invalid" };
  }

  const supabase = await createClient();
  const result = await supabase
    .from("portfolios")
    .update({ draft_content: toDatabaseJson(content.data) })
    .eq("id", parsedId.data)
    .eq("user_id", user.userId)
    .eq("updated_at", updatedAt.data)
    .select("id, draft_content, updated_at")
    .maybeSingle();

  if (result.error) {
    logPortfolioDatabaseError("draft-editor-update", result.error, parsedId.data);
    return {
      success: false,
      message: "The draft could not be saved. Please try again.",
      reason: "unavailable",
    };
  }
  if (!result.data) {
    return {
      success: false,
      message: "This draft changed elsewhere. Reload before saving again.",
      reason: "stale",
    };
  }

  const saved = PortfolioDataSchema.safeParse(result.data.draft_content);
  if (!saved.success) {
    return { success: false, message: "The saved draft is invalid.", reason: "invalid" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/editor");
  revalidatePath("/themes");

  return { success: true, content: saved.data, updatedAt: result.data.updated_at };
}
