import { z } from "zod";

const CleanStringSchema = z.string();
const StringListSchema = z.array(CleanStringSchema);

const ExtractedPersonalSchema = z.strictObject({
  fullName: CleanStringSchema,
  headline: CleanStringSchema,
  email: CleanStringSchema,
  phone: CleanStringSchema,
  location: CleanStringSchema,
});

const ExtractedExperienceSchema = z.strictObject({
  company: CleanStringSchema,
  role: CleanStringSchema,
  employmentType: CleanStringSchema,
  location: CleanStringSchema,
  startDate: CleanStringSchema,
  endDate: CleanStringSchema,
  isCurrent: z.boolean(),
  description: CleanStringSchema,
  highlights: StringListSchema,
});

const ExtractedEducationSchema = z.strictObject({
  institution: CleanStringSchema,
  degree: CleanStringSchema,
  fieldOfStudy: CleanStringSchema,
  location: CleanStringSchema,
  startDate: CleanStringSchema,
  endDate: CleanStringSchema,
  grade: CleanStringSchema,
  description: CleanStringSchema,
});

const ExtractedProjectSchema = z.strictObject({
  name: CleanStringSchema,
  description: CleanStringSchema,
  technologies: StringListSchema,
  highlights: StringListSchema,
  projectUrl: CleanStringSchema,
  githubUrl: CleanStringSchema,
  startDate: CleanStringSchema,
  endDate: CleanStringSchema,
});

const ExtractedSkillGroupSchema = z.strictObject({
  category: CleanStringSchema,
  items: StringListSchema,
});

const ExtractedAchievementSchema = z.strictObject({
  title: CleanStringSchema,
  issuer: CleanStringSchema,
  date: CleanStringSchema,
  description: CleanStringSchema,
});

const ExtractedCertificationSchema = z.strictObject({
  name: CleanStringSchema,
  issuer: CleanStringSchema,
  issueDate: CleanStringSchema,
  expiryDate: CleanStringSchema,
  credentialId: CleanStringSchema,
  credentialUrl: CleanStringSchema,
});

export const ExtractedLinkTypeSchema = z.enum([
  "linkedin",
  "github",
  "portfolio",
  "behance",
  "dribbble",
  "medium",
  "youtube",
  "other",
]);

const ExtractedLinkSchema = z.strictObject({
  type: ExtractedLinkTypeSchema,
  label: CleanStringSchema,
  url: CleanStringSchema,
});

const ExtractedLanguageSchema = z.strictObject({
  name: CleanStringSchema,
  proficiency: CleanStringSchema,
});

const ExtractedCustomSectionItemSchema = z.strictObject({
  title: CleanStringSchema,
  subtitle: CleanStringSchema,
  date: CleanStringSchema,
  description: CleanStringSchema,
});

const ExtractedCustomSectionSchema = z.strictObject({
  title: CleanStringSchema,
  items: z.array(ExtractedCustomSectionItemSchema),
});

export const GeminiResumeExtractionSchema = z.strictObject({
  personal: ExtractedPersonalSchema,
  summary: CleanStringSchema,
  experience: z.array(ExtractedExperienceSchema),
  education: z.array(ExtractedEducationSchema),
  projects: z.array(ExtractedProjectSchema),
  skills: z.array(ExtractedSkillGroupSchema),
  achievements: z.array(ExtractedAchievementSchema),
  certifications: z.array(ExtractedCertificationSchema),
  links: z.array(ExtractedLinkSchema),
  languages: z.array(ExtractedLanguageSchema),
  interests: StringListSchema,
  customSections: z.array(ExtractedCustomSectionSchema),
});

export type GeminiResumeExtraction = z.infer<
  typeof GeminiResumeExtractionSchema
>;

const generatedJsonSchema = z.toJSONSchema(GeminiResumeExtractionSchema);

delete generatedJsonSchema.$schema;

export const GEMINI_RESUME_EXTRACTION_JSON_SCHEMA = generatedJsonSchema;

export type GeminiExtractionParseResult =
  | { success: true; data: GeminiResumeExtraction }
  | { success: false };

export function parseGeminiResumeExtraction(
  responseText: string,
): GeminiExtractionParseResult {
  let value: unknown;

  try {
    value = JSON.parse(responseText);
  } catch {
    return { success: false };
  }

  const parsed = GeminiResumeExtractionSchema.safeParse(value);

  return parsed.success
    ? { success: true, data: parsed.data }
    : { success: false };
}
