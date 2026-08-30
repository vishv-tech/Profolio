import {
  canStartSchemaRepair,
  GeminiOverallTimeoutError,
  remainingGeminiBudgetMs,
} from "@/lib/ai/extraction-budget";
import { GeminiConfigurationError } from "@/lib/ai/extraction-errors";
import {
  isTransientGeminiAvailabilityError,
  ModelAttemptTimeoutError,
} from "@/lib/ai/model-fallback";
import { normalizeResumeExtraction } from "@/lib/ai/normalize-portfolio";
import {
  parseGeminiResumeExtraction,
  type GeminiExtractionValidationIssue,
} from "@/lib/ai/resume-schema";
import type { ResumeProcessingTiming } from "@/lib/resumes/timing";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";
import type { PortfolioData } from "@/types/portfolio";

export type GeminiResumePipelineResult =
  | {
      success: true;
      source: "gemini";
      data: PortfolioData;
      model: string;
    }
  | {
      success: false;
      source: "gemini";
      reason:
        | "invalid-data"
        | "invalid-response"
        | "permanent-error"
        | "timeout"
        | "unavailable"
        | "unconfigured";
      error?: unknown;
      issues?: GeminiExtractionValidationIssue[];
    };

type GeminiPipelineRequest = (
  repairAttempt: boolean,
  overallSignal: AbortSignal,
) => Promise<{ model: string; text: string }>;

type GeminiResumePipelineOptions = {
  canRepair?: (deadlineMs: number) => boolean;
  overallTimeoutMs: number;
  request: GeminiPipelineRequest;
  timing?: ResumeProcessingTiming;
};

function requestWithinOverallBudget(
  request: GeminiPipelineRequest,
  repairAttempt: boolean,
  signal: AbortSignal,
) {
  return new Promise<{ model: string; text: string }>((resolve, reject) => {
    const rejectAbort = () => {
      signal.removeEventListener("abort", rejectAbort);
      reject(signal.reason ?? new Error("Gemini request was aborted."));
    };

    if (signal.aborted) {
      rejectAbort();
      return;
    }

    signal.addEventListener("abort", rejectAbort, { once: true });
    request(repairAttempt, signal).then(
      (value) => {
        signal.removeEventListener("abort", rejectAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", rejectAbort);
        reject(error);
      },
    );
  });
}

export function classifyGeminiPipelineError(
  error: unknown,
): Exclude<GeminiResumePipelineResult, { success: true }>["reason"] {
  if (error instanceof GeminiConfigurationError) {
    return "unconfigured";
  }

  if (
    error instanceof GeminiOverallTimeoutError ||
    error instanceof ModelAttemptTimeoutError
  ) {
    return "timeout";
  }

  return isTransientGeminiAvailabilityError(error)
    ? "unavailable"
    : "permanent-error";
}

export async function runGeminiResumePipeline({
  canRepair = canStartSchemaRepair,
  overallTimeoutMs,
  request,
  timing,
}: GeminiResumePipelineOptions): Promise<GeminiResumePipelineResult> {
  const overallDeadline = performance.now() + overallTimeoutMs;
  const overallController = new AbortController();
  const overallTimeout = setTimeout(
    () =>
      overallController.abort(new GeminiOverallTimeoutError(overallTimeoutMs)),
    overallTimeoutMs,
  );
  let lastFailure: Exclude<
    ReturnType<typeof parseGeminiResumeExtraction>,
    { success: true }
  > | null = null;

  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (attempt === 1 && !canRepair(overallDeadline)) {
        timing?.record("gemini-schema-repair", 0, "insufficient-budget");

        if (process.env.NODE_ENV === "development") {
          console.warn("[resume-extraction]", {
            stage: "schema-repair-skipped",
            reason: "insufficient-overall-budget",
            remainingMs: Math.round(remainingGeminiBudgetMs(overallDeadline)),
          });
        }

        break;
      }

      let response: { model: string; text: string };

      try {
        response = await requestWithinOverallBudget(
          request,
          attempt === 1,
          overallController.signal,
        );
      } catch (error) {
        return {
          success: false,
          source: "gemini",
          reason: classifyGeminiPipelineError(error),
          error,
        };
      }

      const parsed = timing
        ? timing.measureSync("json-parse", () =>
            parseGeminiResumeExtraction(response.text),
          )
        : parseGeminiResumeExtraction(response.text);

      if (!parsed.success) {
        lastFailure = parsed;
        continue;
      }

      try {
        const data = timing
          ? timing.measureSync("portfolio-normalization", () =>
              PortfolioDataSchema.parse(normalizeResumeExtraction(parsed.data)),
            )
          : PortfolioDataSchema.parse(normalizeResumeExtraction(parsed.data));

        return {
          success: true,
          source: "gemini",
          data,
          model: response.model,
        };
      } catch (error) {
        return {
          success: false,
          source: "gemini",
          reason: "invalid-data",
          error,
        };
      }
    }
  } finally {
    clearTimeout(overallTimeout);
  }

  return {
    success: false,
    source: "gemini",
    reason: "invalid-response",
    ...(lastFailure?.reason === "schema" ? { issues: lastFailure.issues } : {}),
  };
}
