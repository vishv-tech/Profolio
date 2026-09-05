"use server";

import { revalidatePath } from "next/cache";

import { requireActiveUser } from "@/lib/auth/guards";
import { scorePortfolio } from "@/lib/portfolio-score/score";
import {
  generateStructuredPortfolioIntelligence,
  generateStructuredUpgradePlan,
} from "@/lib/portfolio-intelligence/gemini";
import {
  applyContentImprovementPatch,
  readContentImprovementTarget,
} from "@/lib/portfolio-intelligence/patches";
import {
  ContentImprovementPatchSchema,
  ContentImprovementTargetSchema,
  type ContentImprovementPatch,
  type PortfolioUpgradePlan,
} from "@/lib/portfolio-intelligence/schemas";
import {
  generateContentImprovement,
  generateReliablePortfolioUpgradePlan,
} from "@/lib/portfolio-intelligence/service";
import { PortfolioIdSchema } from "@/lib/portfolios/contracts";
import { logPortfolioDatabaseError } from "@/lib/portfolios/database-errors";
import { toDatabaseJson } from "@/lib/resumes/json";
import { createClient } from "@/lib/supabase/server";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";
import type { PortfolioData } from "@/types/portfolio";

const AI_UNAVAILABLE_MESSAGE =
  "AI suggestions are temporarily unavailable. Try again.";

type OwnedDraft = {
  content: PortfolioData;
  updatedAt: string;
};

async function loadOwnedDraft(
  portfolioId: string,
  userId: string,
): Promise<OwnedDraft | null> {
  const supabase = await createClient();
  const result = await supabase
    .from("portfolios")
    .select("id, draft_content, updated_at")
    .eq("id", portfolioId)
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error || !result.data) {
    logPortfolioDatabaseError("intelligence-draft-read", result.error, portfolioId);
    return null;
  }

  const content = PortfolioDataSchema.safeParse(result.data.draft_content);
  return content.success
    ? { content: content.data, updatedAt: result.data.updated_at }
    : null;
}

function hasUsefulContent(data: PortfolioData): boolean {
  return Boolean(
    data.personal.headline.trim() ||
      data.summary.trim() ||
      data.experience.length ||
      data.education.length ||
      data.projects.length ||
      data.skills.some((group) => group.items.length > 0),
  );
}

export type GenerateUpgradePlanActionResult =
  | {
      success: true;
      plan: PortfolioUpgradePlan;
      source: "ai" | "deterministic-fallback";
    }
  | { success: false; message: string; reason: "unavailable" | "insufficient" | "ai" };

export async function generateUpgradePlanAction(
  portfolioId: string,
): Promise<GenerateUpgradePlanActionResult> {
  const user = await requireActiveUser();
  const parsedId = PortfolioIdSchema.safeParse(portfolioId);
  if (!parsedId.success) {
    return { success: false, message: "That portfolio is unavailable.", reason: "unavailable" };
  }

  const draft = await loadOwnedDraft(parsedId.data, user.userId);
  if (!draft) {
    return { success: false, message: "That portfolio is unavailable.", reason: "unavailable" };
  }

  if (!hasUsefulContent(draft.content)) {
    return {
      success: false,
      message: "Add some portfolio content before generating an AI upgrade plan.",
      reason: "insufficient",
    };
  }

  try {
    const result = await generateReliablePortfolioUpgradePlan(
      draft.content,
      scorePortfolio(draft.content),
      generateStructuredUpgradePlan,
    );

    return { success: true, plan: result.plan, source: result.source };
  } catch {
    return { success: false, message: AI_UNAVAILABLE_MESSAGE, reason: "ai" };
  }
}

export type GenerateImprovementActionResult =
  | { success: true; patch: ContentImprovementPatch }
  | {
      success: false;
      message: string;
      reason: "unavailable" | "invalid" | "stale" | "ai";
    };

export async function generateContentImprovementAction(
  portfolioId: string,
  targetValue: unknown,
): Promise<GenerateImprovementActionResult> {
  const user = await requireActiveUser();
  const parsedId = PortfolioIdSchema.safeParse(portfolioId);
  const target = ContentImprovementTargetSchema.safeParse(targetValue);

  if (!parsedId.success || !target.success) {
    return { success: false, message: "That content cannot be improved.", reason: "invalid" };
  }

  const draft = await loadOwnedDraft(parsedId.data, user.userId);
  if (!draft) {
    return { success: false, message: "That portfolio is unavailable.", reason: "unavailable" };
  }

  const current = readContentImprovementTarget(draft.content, target.data);
  if (current === null) {
    return { success: false, message: "That content cannot be improved.", reason: "invalid" };
  }
  if (current !== target.data.original) {
    return {
      success: false,
      message: "This content changed. Save your latest edits and generate a new suggestion.",
      reason: "stale",
    };
  }

  try {
    const patch = await generateContentImprovement(
      draft.content,
      target.data,
      generateStructuredPortfolioIntelligence,
    );
    return patch
      ? { success: true, patch }
      : { success: false, message: AI_UNAVAILABLE_MESSAGE, reason: "ai" };
  } catch {
    return { success: false, message: AI_UNAVAILABLE_MESSAGE, reason: "ai" };
  }
}

export type ApplyImprovementActionResult =
  | { success: true; content: PortfolioData; updatedAt: string }
  | {
      success: false;
      message: string;
      reason: "unavailable" | "invalid" | "stale";
    };

export async function applyContentImprovementAction(
  portfolioId: string,
  patchValue: unknown,
): Promise<ApplyImprovementActionResult> {
  const user = await requireActiveUser();
  const parsedId = PortfolioIdSchema.safeParse(portfolioId);
  const patch = ContentImprovementPatchSchema.safeParse(patchValue);

  if (!parsedId.success || !patch.success) {
    return { success: false, message: "That suggestion is invalid.", reason: "invalid" };
  }

  const draft = await loadOwnedDraft(parsedId.data, user.userId);
  if (!draft) {
    return { success: false, message: "That portfolio is unavailable.", reason: "unavailable" };
  }

  const applied = applyContentImprovementPatch(draft.content, patch.data);
  if (!applied.success) {
    return applied.reason === "stale"
      ? {
          success: false,
          message: "This content changed. Generate a new suggestion before applying it.",
          reason: "stale",
        }
      : { success: false, message: "That suggestion is invalid.", reason: "invalid" };
  }

  const supabase = await createClient();
  const result = await supabase
    .from("portfolios")
    .update({ draft_content: toDatabaseJson(applied.data) })
    .eq("id", parsedId.data)
    .eq("user_id", user.userId)
    .eq("updated_at", draft.updatedAt)
    .select("id, draft_content, updated_at")
    .maybeSingle();

  if (result.error) {
    logPortfolioDatabaseError("intelligence-patch-update", result.error, parsedId.data);
    return {
      success: false,
      message: "The suggestion could not be applied. Please try again.",
      reason: "unavailable",
    };
  }
  if (!result.data) {
    return {
      success: false,
      message: "This content changed. Generate a new suggestion before applying it.",
      reason: "stale",
    };
  }

  const saved = PortfolioDataSchema.safeParse(result.data.draft_content);
  if (!saved.success) {
    return { success: false, message: "That suggestion is invalid.", reason: "invalid" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/editor");
  revalidatePath("/themes");

  return { success: true, content: saved.data, updatedAt: result.data.updated_at };
}
