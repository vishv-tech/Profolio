import type { GeminiResumePipelineResult } from "@/lib/ai/gemini-resume-pipeline";
import type { DeterministicExtractionResult } from "@/lib/resumes/deterministic-pipeline";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";
import type { PortfolioData } from "@/types/portfolio";

export type ResumeExtractionSource = "deterministic" | "gemini";

export type CoordinatedResumeExtractionResult =
  | {
      success: true;
      source: ResumeExtractionSource;
      data: PortfolioData;
      model?: string;
    }
  | {
      success: false;
      reason: "all-extraction-failed";
      deterministic: Exclude<DeterministicExtractionResult, { success: true }>;
      gemini: Exclude<GeminiResumePipelineResult, { success: true }>;
    };

type ExtractionCoordinatorOptions = {
  improveWithAi: boolean;
  onBranchStart?: (source: ResumeExtractionSource) => void;
  pdfBytes: Uint8Array;
  runDeterministic: (
    pdfBytes: Uint8Array,
  ) => Promise<DeterministicExtractionResult>;
  runGemini: (
    pdfBytes: Uint8Array,
    improveWithAi: boolean,
  ) => Promise<GeminiResumePipelineResult>;
};

function failedDeterministicResult(): Exclude<
  DeterministicExtractionResult,
  { success: true }
> {
  return {
    success: false,
    source: "deterministic",
    reason: "pdf-parse",
  };
}

function failedGeminiResult(error: unknown): Exclude<
  GeminiResumePipelineResult,
  { success: true }
> {
  return {
    success: false,
    source: "gemini",
    reason: "permanent-error",
    error,
  };
}

function startDeterministicBranch(
  options: ExtractionCoordinatorOptions,
): Promise<DeterministicExtractionResult> {
  options.onBranchStart?.("deterministic");

  try {
    return Promise.resolve(options.runDeterministic(options.pdfBytes)).then(
      (result) =>
        result.success && !PortfolioDataSchema.safeParse(result.data).success
          ? { ...failedDeterministicResult(), reason: "invalid-data" }
          : result,
      () => failedDeterministicResult(),
    );
  } catch {
    return Promise.resolve(failedDeterministicResult());
  }
}

function startGeminiBranch(
  options: ExtractionCoordinatorOptions,
): Promise<GeminiResumePipelineResult> {
  options.onBranchStart?.("gemini");

  try {
    return Promise.resolve(
      options.runGemini(options.pdfBytes, options.improveWithAi),
    ).then(
      (result) =>
        result.success && !PortfolioDataSchema.safeParse(result.data).success
          ? {
              success: false,
              source: "gemini" as const,
              reason: "invalid-data" as const,
            }
          : result,
      (error: unknown) => failedGeminiResult(error),
    );
  } catch (error) {
    return Promise.resolve(failedGeminiResult(error));
  }
}

export async function coordinateResumeExtraction(
  options: ExtractionCoordinatorOptions,
): Promise<CoordinatedResumeExtractionResult> {
  const deterministicPromise = startDeterministicBranch(options);
  const geminiPromise = startGeminiBranch(options);
  const gemini = await geminiPromise;

  if (gemini.success) {
    return {
      success: true,
      source: "gemini",
      data: gemini.data,
      model: gemini.model,
    };
  }

  const deterministic = await deterministicPromise;

  if (deterministic.success) {
    return {
      success: true,
      source: "deterministic",
      data: deterministic.data,
    };
  }

  return {
    success: false,
    reason: "all-extraction-failed",
    deterministic,
    gemini,
  };
}
