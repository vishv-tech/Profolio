import "server-only";

import type { Part } from "@google/genai";
import { ZodError } from "zod";

import {
  canStartSchemaRepair,
  GeminiOverallTimeoutError,
  remainingGeminiBudgetMs,
} from "@/lib/ai/extraction-budget";
import {
  GEMINI_MODEL_ATTEMPT_TIMEOUT_MS,
  GEMINI_OVERALL_TIMEOUT_MS,
  requestWithGeminiAvailabilityFallback,
} from "@/lib/ai/gemini";
import { buildPortfolioFromResumeExtraction } from "@/lib/ai/normalize-portfolio";
import {
  createResumeExtractionPrompt,
  RESUME_EXTRACTION_SYSTEM_PROMPT,
} from "@/lib/ai/prompts";
import {
  GEMINI_RESUME_EXTRACTION_JSON_SCHEMA,
  parseGeminiResumeExtraction,
  type GeminiExtractionValidationIssue,
} from "@/lib/ai/resume-schema";
import {
  parseResumePdf,
  type ResumePdfSource,
} from "@/lib/resumes/resume-source.server";
import type { ResumeProcessingTiming } from "@/lib/resumes/timing";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";
import type { PortfolioData } from "@/types/portfolio";

export type ResumeExtractionStage =
  | "database-read"
  | "database-claim"
  | "storage-download"
  | "stored-pdf-validation"
  | "pdf-deterministic-parse"
  | "gemini-request"
  | "response-json"
  | "extraction-schema"
  | "normalization"
  | "portfolio-validation"
  | "database-completion"
  | "database-failure-update"
  | "process-resume";

type ResumeExtractionErrorOptions = {
  cause?: unknown;
  issues?: GeminiExtractionValidationIssue[];
};

type PreparedResumeSource =
  | { kind: "pdf"; base64: string }
  | { kind: "text"; text: string };

type ExtractPortfolioOptions = {
  timing?: ResumeProcessingTiming;
};

type GeminiRequestPhase = "initial" | "repair";

const EMPTY_PDF_SOURCE: ResumePdfSource = {
  diagnostics: {
    annotationPageFailures: 0,
    pageFailures: 0,
    textPageFailures: 0,
  },
  links: [],
  pageCount: 0,
  text: "",
  useTextForGemini: false,
};

export class ResumeExtractionError extends Error {
  readonly stage: ResumeExtractionStage;
  readonly cause?: unknown;
  readonly issues?: GeminiExtractionValidationIssue[];

  constructor(
    stage: ResumeExtractionStage,
    message: string,
    options: ResumeExtractionErrorOptions = {},
  ) {
    super(message);
    this.name = "ResumeExtractionError";
    this.stage = stage;
    this.cause = options.cause;
    this.issues = options.issues;
  }
}

type UnknownErrorRecord = {
  name?: unknown;
  message?: unknown;
  status?: unknown;
  code?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function safeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeStatusOrCode(value: unknown) {
  return typeof value === "string" || typeof value === "number"
    ? value
    : undefined;
}

function redactSensitiveText(value: string) {
  let redacted = value.replace(
    /([?&](?:key|api_key)=)[^&\s]+/giu,
    "$1[redacted]",
  );
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (apiKey) {
    redacted = redacted.split(apiKey).join("[redacted]");
  }

  return redacted.slice(0, 300);
}

function parseApiMessage(message: string) {
  try {
    const parsed: unknown = JSON.parse(message);

    if (!isRecord(parsed) || !isRecord(parsed.error)) {
      return null;
    }

    return {
      code:
        typeof parsed.error.status === "string"
          ? parsed.error.status
          : parsed.error.code,
      message: safeString(parsed.error.message, "Gemini API request failed."),
      status: parsed.error.code,
    };
  } catch {
    return null;
  }
}

function safeErrorDetails(error: unknown) {
  const record: UnknownErrorRecord = isRecord(error) ? error : {};
  const rawMessage = safeString(record.message, "Unknown server error.");
  const apiMessage = parseApiMessage(rawMessage);
  const status =
    safeStatusOrCode(record.status) ?? safeStatusOrCode(apiMessage?.status);
  const code =
    safeStatusOrCode(record.code) ?? safeStatusOrCode(apiMessage?.code);

  return {
    name: safeString(record.name, "Error"),
    message: redactSensitiveText(apiMessage?.message ?? rawMessage),
    ...(status !== undefined ? { status } : {}),
    ...(code !== undefined ? { code } : {}),
  };
}

export function logResumeExtractionError(
  fallbackStage: ResumeExtractionStage,
  error: unknown,
) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const extractionError =
    error instanceof ResumeExtractionError ? error : null;
  const sourceError = extractionError?.cause ?? error;
  const issues =
    extractionError?.issues ??
    (sourceError instanceof ZodError
      ? sourceError.issues.map((issue) => ({
          path: issue.path.map(String).join(".") || "<root>",
          code: issue.code,
          message: issue.message.slice(0, 160),
        }))
      : undefined);

  console.error("[resume-extraction]", {
    stage: extractionError?.stage ?? fallbackStage,
    ...safeErrorDetails(sourceError),
    ...(issues ? { issues } : {}),
  });
}

function sourcePart(source: PreparedResumeSource): Part {
  if (source.kind === "text") {
    return {
      text: `--- BEGIN UNTRUSTED RESUME TEXT ---\n${source.text}\n--- END UNTRUSTED RESUME TEXT ---`,
    };
  }

  return {
    inlineData: {
      data: source.base64,
      mimeType: "application/pdf",
    },
  };
}

function logGeminiAttempt(
  stage: "model-attempt-end" | "model-attempt-start" | "model-fallback",
  details: Record<string, number | string>,
) {
  if (process.env.NODE_ENV === "development") {
    console.info("[resume-extraction]", { stage, ...details });
  }
}

async function requestExtraction(
  source: PreparedResumeSource,
  improveWithAi: boolean,
  repairAttempt: boolean,
  overallSignal: AbortSignal,
  timing?: ResumeProcessingTiming,
) {
  const phase: GeminiRequestPhase = repairAttempt ? "repair" : "initial";
  const parts: Part[] = [
    {
      text: createResumeExtractionPrompt(
        improveWithAi,
        repairAttempt,
        source.kind,
      ),
    },
    sourcePart(source),
  ];

  try {
    const { model, value: response } =
      await requestWithGeminiAvailabilityFallback(
        (client, selectedModel, attemptSignal) =>
          client.models.generateContent({
            model: selectedModel,
            contents: [{ role: "user", parts }],
            config: {
              abortSignal: attemptSignal,
              httpOptions: {
                retryOptions: { attempts: 1 },
                timeout: GEMINI_MODEL_ATTEMPT_TIMEOUT_MS,
              },
              maxOutputTokens: 32_768,
              responseJsonSchema: GEMINI_RESUME_EXTRACTION_JSON_SCHEMA,
              responseMimeType: "application/json",
              systemInstruction: RESUME_EXTRACTION_SYSTEM_PROMPT,
            },
          }),
        {
          onAttempt: (result) => {
            const outcome =
              result.outcome === "timeout"
                ? "attempt_timeout"
                : result.outcome;
            logGeminiAttempt("model-attempt-end", {
              attemptNumber: result.attemptNumber,
              durationMs: Math.max(0, Math.round(result.durationMs)),
              inputMode: source.kind,
              model: result.model,
              outcome,
              phase,
            });
            timing?.record(
              `gemini-${result.model}`,
              result.durationMs,
              `${phase}-${outcome}`,
            );
          },
          onAttemptStart: ({ attemptNumber, model }) => {
            logGeminiAttempt("model-attempt-start", {
              attemptNumber,
              inputMode: source.kind,
              model,
              phase,
            });
          },
          onFallback: (fromModel, toModel) => {
            logGeminiAttempt("model-fallback", {
              fromModel,
              inputMode: source.kind,
              phase,
              toModel,
            });
          },
          overallSignal,
        },
      );

    return {
      model,
      text: response.text?.trim() ?? "",
    };
  } catch (error) {
    throw new ResumeExtractionError(
      "gemini-request",
      "The Gemini request failed.",
      { cause: error },
    );
  }
}

function prepareGeminiSource(
  source: ResumePdfSource,
  pdfBytes: Uint8Array,
): PreparedResumeSource {
  return source.useTextForGemini
    ? { kind: "text", text: source.text }
    : { kind: "pdf", base64: Buffer.from(pdfBytes).toString("base64") };
}

function logPdfSourceDiagnostics(source: ResumePdfSource) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info("[resume-extraction]", {
    stage: "pdf-deterministic-parse",
    annotationLinks: source.links.length,
    inputMode: source.useTextForGemini ? "text" : "pdf",
    pageCount: source.pageCount,
    textCharacters: source.text.length,
    ...source.diagnostics,
  });
}

export async function extractPortfolioFromPdf(
  pdfBytes: Uint8Array,
  improveWithAi: boolean,
  { timing }: ExtractPortfolioOptions = {},
): Promise<PortfolioData> {
  let source = EMPTY_PDF_SOURCE;

  try {
    source = timing
      ? await timing.measure("pdf-deterministic-parse", () =>
          parseResumePdf(pdfBytes),
        )
      : await parseResumePdf(pdfBytes);
    logPdfSourceDiagnostics(source);
  } catch (error) {
    // Local parsing is an enhancement; Gemini's existing PDF path remains the fallback.
    logResumeExtractionError("pdf-deterministic-parse", error);
  }

  const preparedSource = timing
    ? timing.measureSync("gemini-input-preparation", () =>
        prepareGeminiSource(source, pdfBytes),
      )
    : prepareGeminiSource(source, pdfBytes);
  const overallStartedAt = performance.now();
  const overallDeadline = overallStartedAt + GEMINI_OVERALL_TIMEOUT_MS;
  const overallController = new AbortController();
  const overallTimeout = setTimeout(
    () =>
      overallController.abort(
        new GeminiOverallTimeoutError(GEMINI_OVERALL_TIMEOUT_MS),
      ),
    GEMINI_OVERALL_TIMEOUT_MS,
  );
  let lastFailure: Exclude<
    ReturnType<typeof parseGeminiResumeExtraction>,
    { success: true }
  > | null = null;

  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (attempt === 1 && !canStartSchemaRepair(overallDeadline)) {
        const remainingMs = Math.round(
          remainingGeminiBudgetMs(overallDeadline),
        );
        timing?.record("gemini-schema-repair", 0, "insufficient-budget");

        if (process.env.NODE_ENV === "development") {
          console.warn("[resume-extraction]", {
            stage: "schema-repair-skipped",
            reason: "insufficient-overall-budget",
            remainingMs,
          });
        }

        break;
      }

      const response = await requestExtraction(
        preparedSource,
        improveWithAi,
        attempt === 1,
        overallController.signal,
        timing,
      );
      const parsed = timing
        ? timing.measureSync("json-parse", () =>
            parseGeminiResumeExtraction(response.text),
          )
        : parseGeminiResumeExtraction(response.text);

      if (parsed.success) {
        let portfolio: PortfolioData;

        try {
          portfolio = timing
            ? timing.measureSync("portfolio-normalization", () =>
                buildPortfolioFromResumeExtraction(parsed.data, {
                  deterministicLinks: source.links,
                }),
              )
            : buildPortfolioFromResumeExtraction(parsed.data, {
                deterministicLinks: source.links,
              });
        } catch (error) {
          throw new ResumeExtractionError(
            "normalization",
            "The extracted resume could not be normalized.",
            { cause: error },
          );
        }

        try {
          const validated = timing
            ? timing.measureSync("portfolio-validation", () =>
                PortfolioDataSchema.parse(portfolio),
              )
            : PortfolioDataSchema.parse(portfolio);

          if (process.env.NODE_ENV === "development") {
            console.info(
              `[resume-extraction] extraction succeeded with ${response.model}`,
            );
          }

          return validated;
        } catch (error) {
          throw new ResumeExtractionError(
            "portfolio-validation",
            "The extracted resume did not match PortfolioData.",
            { cause: error },
          );
        }
      }

      lastFailure = parsed;
    }
  } finally {
    clearTimeout(overallTimeout);
  }

  if (lastFailure?.reason === "schema") {
    throw new ResumeExtractionError(
      "extraction-schema",
      "The Gemini response did not match the extraction schema.",
      { issues: lastFailure.issues },
    );
  }

  throw new ResumeExtractionError(
    "response-json",
    "The Gemini response was not valid JSON.",
  );
}
