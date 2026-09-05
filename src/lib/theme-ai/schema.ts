import { z } from "zod";

import { ThemeFontSchema } from "@/lib/validation/theme";

export const THEME_STUDIO_MODEL = "gemini-3.5-flash" as const;

export const ThemeStudioInstructionSchema = z.string().trim().min(1).max(500);

const ThemeStudioColorSchema = z
  .string()
  .trim()
  .regex(/^#[\da-fA-F]{6}$/, "Use a six-digit hexadecimal color.");

export const ThemeStylePatchSchema = z
  .strictObject({
    colorMode: z.enum(["light", "dark"]).optional(),
    backgroundColor: ThemeStudioColorSchema.optional(),
    surfaceColor: ThemeStudioColorSchema.optional(),
    textColor: ThemeStudioColorSchema.optional(),
    mutedTextColor: ThemeStudioColorSchema.optional(),
    accentColor: ThemeStudioColorSchema.optional(),
    borderColor: ThemeStudioColorSchema.optional(),
    fontFamily: ThemeFontSchema.optional(),
    headingFontFamily: ThemeFontSchema.optional(),
    headingScale: z.enum(["small", "medium", "large"]).optional(),
    borderRadius: z.number().int().min(0).max(32).optional(),
    spacing: z.enum(["compact", "comfortable", "spacious"]).optional(),
    animationIntensity: z.enum(["none", "subtle", "dynamic"]).optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: "A style patch must contain at least one approved property.",
  });

export const ThemeAiResponseSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("style"),
    patch: ThemeStylePatchSchema,
  }),
  z.strictObject({
    kind: z.literal("unsupported"),
    patch: z.null(),
  }),
]);

function jsonSchemaFor(schema: z.ZodType) {
  const generated = z.toJSONSchema(schema);
  delete generated.$schema;
  return generated;
}

export const THEME_AI_RESPONSE_JSON_SCHEMA = jsonSchemaFor(
  ThemeAiResponseSchema,
);

export const THEME_AI_ALLOWED_PROPERTIES = Object.freeze([
  "colorMode",
  "backgroundColor",
  "surfaceColor",
  "textColor",
  "mutedTextColor",
  "accentColor",
  "borderColor",
  "fontFamily",
  "headingFontFamily",
  "headingScale",
  "borderRadius",
  "spacing",
  "animationIntensity",
] as const);

export type ThemeStylePatch = z.infer<typeof ThemeStylePatchSchema>;
export type ThemeAiResponse = z.infer<typeof ThemeAiResponseSchema>;

const COLOR_PROPERTIES = new Set<keyof ThemeStylePatch>([
  "backgroundColor",
  "surfaceColor",
  "textColor",
  "mutedTextColor",
  "accentColor",
  "borderColor",
]);

export function normalizeThemeStylePatch(
  patch: ThemeStylePatch,
): ThemeStylePatch {
  return Object.fromEntries(
    Object.entries(patch).map(([key, value]) => [
      key,
      COLOR_PROPERTIES.has(key as keyof ThemeStylePatch) &&
      typeof value === "string"
        ? value.toLowerCase()
        : value,
    ]),
  ) as ThemeStylePatch;
}

export function parseThemeAiResponse(text: string): ThemeAiResponse | null {
  try {
    const result = ThemeAiResponseSchema.safeParse(JSON.parse(text));
    if (!result.success) return null;

    return result.data.kind === "style"
      ? {
          ...result.data,
          patch: normalizeThemeStylePatch(result.data.patch),
        }
      : result.data;
  } catch {
    return null;
  }
}
