import { parseResumePdf, type ResumePdfSource } from "@/lib/resumes/resume-source";
import {
  buildDeterministicPortfolio,
  isDeterministicPortfolioUsable,
  isResumeTextUsable,
} from "@/lib/resumes/deterministic";
import type { ResumeProcessingTiming } from "@/lib/resumes/timing";
import type { PortfolioData } from "@/types/portfolio";

export type DeterministicExtractionResult =
  | {
      success: true;
      source: "deterministic";
      data: PortfolioData;
      pageCount: number;
      textCharacters: number;
    }
  | {
      success: false;
      source: "deterministic";
      reason: "invalid-data" | "pdf-parse" | "unusable-content" | "unusable-text";
    };

type DeterministicPipelineOptions = {
  parsePdf?: (pdfBytes: Uint8Array) => Promise<ResumePdfSource>;
  timing?: ResumeProcessingTiming;
};

function logDeterministicResult(result: DeterministicExtractionResult) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info("[resume-extraction]", {
    stage: "deterministic-end",
    outcome: result.success ? "success" : result.reason,
    ...(result.success
      ? {
          pageCount: result.pageCount,
          textCharacters: result.textCharacters,
        }
      : {}),
  });
}

export async function runSafeDeterministicPipeline(
  pdfBytes: Uint8Array,
  {
    parsePdf = parseResumePdf,
    timing,
  }: DeterministicPipelineOptions = {},
): Promise<DeterministicExtractionResult> {
  if (process.env.NODE_ENV === "development") {
    console.info("[resume-extraction]", { stage: "deterministic-start" });
  }

  try {
    const source = timing
      ? await timing.measure("deterministic-pdf-parse", () => parsePdf(pdfBytes))
      : await parsePdf(pdfBytes);

    if (!isResumeTextUsable(source.text, source.pageCount)) {
      const result: DeterministicExtractionResult = {
        success: false,
        source: "deterministic",
        reason: "unusable-text",
      };
      logDeterministicResult(result);
      return result;
    }

    const data = timing
      ? timing.measureSync("deterministic-structure", () =>
          buildDeterministicPortfolio(source.text),
        )
      : buildDeterministicPortfolio(source.text);

    if (!isDeterministicPortfolioUsable(data)) {
      const result: DeterministicExtractionResult = {
        success: false,
        source: "deterministic",
        reason: "unusable-content",
      };
      logDeterministicResult(result);
      return result;
    }

    const result: DeterministicExtractionResult = {
      success: true,
      source: "deterministic",
      data,
      pageCount: source.pageCount,
      textCharacters: source.text.length,
    };
    logDeterministicResult(result);
    return result;
  } catch (error) {
    const result: DeterministicExtractionResult = {
      success: false,
      source: "deterministic",
      reason:
        error instanceof Error && error.name === "ZodError"
          ? "invalid-data"
          : "pdf-parse",
    };
    logDeterministicResult(result);
    return result;
  }
}
