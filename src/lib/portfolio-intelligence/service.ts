import type { PortfolioScore } from "@/lib/portfolio-score/score";
import {
  createContentImprovementPrompt,
  createUpgradePlanPrompt,
  PORTFOLIO_COACH_SYSTEM_PROMPT,
} from "@/lib/portfolio-intelligence/prompts";
import {
  CONTENT_IMPROVEMENT_JSON_SCHEMA,
  ContentImprovementTargetSchema,
  GeminiContentImprovementSchema,
  parseStructuredJson,
  PORTFOLIO_UPGRADE_PLAN_JSON_SCHEMA,
  PortfolioUpgradePlanSchema,
  type ContentImprovementTarget,
  type PortfolioUpgradePlan,
} from "@/lib/portfolio-intelligence/schemas";
import { createContentImprovementPatch } from "@/lib/portfolio-intelligence/patches";
import type { PortfolioData } from "@/types/portfolio";

export type GenerateStructuredContent = (input: {
  jsonSchema: Record<string, unknown>;
  prompt: string;
  systemInstruction: string;
}) => Promise<string>;

export async function generatePortfolioUpgradePlan(
  data: PortfolioData,
  score: PortfolioScore,
  generate: GenerateStructuredContent,
): Promise<PortfolioUpgradePlan | null> {
  const response = await generate({
    jsonSchema: PORTFOLIO_UPGRADE_PLAN_JSON_SCHEMA,
    prompt: createUpgradePlanPrompt(data, score),
    systemInstruction: PORTFOLIO_COACH_SYSTEM_PROMPT,
  });

  return parseStructuredJson(response, PortfolioUpgradePlanSchema);
}

export async function generateContentImprovement(
  data: PortfolioData,
  targetValue: unknown,
  generate: GenerateStructuredContent,
) {
  const target = ContentImprovementTargetSchema.safeParse(targetValue);
  if (!target.success) return null;

  const response = await generate({
    jsonSchema: CONTENT_IMPROVEMENT_JSON_SCHEMA,
    prompt: createContentImprovementPrompt(data, target.data),
    systemInstruction: PORTFOLIO_COACH_SYSTEM_PROMPT,
  });
  const suggestion = parseStructuredJson(response, GeminiContentImprovementSchema);

  return suggestion
    ? createContentImprovementPatch(target.data, suggestion)
    : null;
}

export type { ContentImprovementTarget };
