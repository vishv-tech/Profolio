import { z } from "zod";

export const UpgradePrioritySchema = z.enum(["high", "medium", "low"]);

export const UpgradePlanPrioritySchema = z.strictObject({
  area: z.enum([
    "profile",
    "experience",
    "education",
    "projects",
    "skills",
    "proof",
    "structure",
  ]),
  priority: UpgradePrioritySchema,
  title: z.string().trim().min(1).max(120),
  reason: z.string().trim().min(1).max(500),
  recommendation: z.string().trim().min(1).max(700),
});

export const PortfolioUpgradePlanSchema = z.strictObject({
  overview: z.string().trim().min(1).max(1_000),
  strengths: z.array(z.string().trim().min(1).max(300)).min(1).max(5),
  priorities: z.array(UpgradePlanPrioritySchema).min(1).max(6),
  skillSuggestions: z.array(z.string().trim().min(1).max(300)).max(4),
  projectIdeas: z.array(z.string().trim().min(1).max(400)).max(4),
  certificationIdeas: z.array(z.string().trim().min(1).max(300)).max(3),
  professionalPresence: z.array(z.string().trim().min(1).max(300)).max(4),
});

export type PortfolioUpgradePlan = z.infer<typeof PortfolioUpgradePlanSchema>;

export const ImprovementSectionSchema = z.enum([
  "summary",
  "personal",
  "experience",
  "education",
  "projects",
  "achievements",
  "customSections",
]);

export const ImprovementFieldSchema = z.enum([
  "summary",
  "headline",
  "description",
  "highlight",
]);

const improvementTargetShape = {
  section: ImprovementSectionSchema,
  itemId: z.string().min(1).max(200).nullable(),
  field: ImprovementFieldSchema,
  listIndex: z.number().int().min(0).max(100).nullable(),
  original: z.string().max(12_000),
};

function validateTargetShape(
  value: {
    section: z.infer<typeof ImprovementSectionSchema>;
    itemId: string | null;
    field: z.infer<typeof ImprovementFieldSchema>;
    listIndex: number | null;
    original: string;
  },
  context: z.RefinementCtx,
) {
  if (!value.original.trim()) {
    context.addIssue({
      code: "custom",
      message: "The selected field must contain factual text first.",
      path: ["original"],
    });
  }

  const isRootSummary =
    value.section === "summary" &&
    value.field === "summary" &&
    value.itemId === null &&
    value.listIndex === null;
  const isHeadline =
    value.section === "personal" &&
    value.field === "headline" &&
    value.itemId === null &&
    value.listIndex === null;
  const isDescription =
    ["experience", "education", "projects", "achievements", "customSections"].includes(
      value.section,
    ) &&
    value.field === "description" &&
    value.itemId !== null &&
    value.listIndex === null;
  const isHighlight =
    ["experience", "projects"].includes(value.section) &&
    value.field === "highlight" &&
    value.itemId !== null &&
    value.listIndex !== null;

  if (!isRootSummary && !isHeadline && !isDescription && !isHighlight) {
    context.addIssue({
      code: "custom",
      message: "That portfolio field cannot be improved with AI.",
      path: ["field"],
    });
  }
}

export const ContentImprovementTargetSchema = z
  .strictObject(improvementTargetShape)
  .superRefine(validateTargetShape);

export const ContentImprovementPatchSchema = z
  .strictObject({
    ...improvementTargetShape,
    suggested: z.string().trim().min(1).max(12_000),
    reason: z.string().trim().min(1).max(600),
  })
  .superRefine(validateTargetShape);

export const GeminiContentImprovementSchema = z.strictObject({
  suggested: z.string().trim().min(1).max(12_000),
  reason: z.string().trim().min(1).max(600),
});

export type ContentImprovementTarget = z.infer<
  typeof ContentImprovementTargetSchema
>;
export type ContentImprovementPatch = z.infer<
  typeof ContentImprovementPatchSchema
>;

function jsonSchemaFor(schema: z.ZodType) {
  const generated = z.toJSONSchema(schema);
  delete generated.$schema;
  return generated;
}

export const PORTFOLIO_UPGRADE_PLAN_JSON_SCHEMA = jsonSchemaFor(
  PortfolioUpgradePlanSchema,
);
export const CONTENT_IMPROVEMENT_JSON_SCHEMA = jsonSchemaFor(
  GeminiContentImprovementSchema,
);

export function parseStructuredJson<TValue>(
  text: string,
  schema: z.ZodType<TValue>,
): TValue | null {
  try {
    const parsed: unknown = JSON.parse(text);
    const result = schema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
