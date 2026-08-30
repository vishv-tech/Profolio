import "server-only";

import type { Part } from "@google/genai";
import { ZodError } from "zod";

import {
  GEMINI_MODEL_ATTEMPT_TIMEOUT_MS,
  GEMINI_OVERALL_TIMEOUT_MS,
  requestWithGeminiAvailabilityFallback,
} from "@/lib/ai/gemini";
import {
  runGeminiResumePipeline,
  type GeminiResumePipelineResult,
} from "@/lib/ai/gemini-resume-pipeline";
import {
  createResumeExtractionPrompt,
  RESUME_EXTRACTION_SYSTEM_PROMPT,
} from "@/lib/ai/prompts";
import { GEMINI_RESUME_EXTRACTION_JSON_SCHEMA } from "@/lib/ai/resume-schema";
import type { ResumeProcessingTiming } from "@/lib/resumes/timing";

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
  issues?: { path: string; code: string; message: string }[];
};

type ExtractPortfolioOptions = {
  timing?: ResumeProcessingTiming;
};

type GeminiRequestPhase = "initial" | "repair";

export class ResumeExtractionError extends Error {
  readonly stage: ResumeExtractionStage;
  readonly cause?: unknown;
  readonly issues?: { path: string; code: string; message: string }[];

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

function logGeminiAttempt(
  stage: "model-attempt-end" | "model-attempt-start",
  details: Record<string, number | string>,
) {
  if (process.env.NODE_ENV === "development") {
    console.info("[resume-extraction]", { stage, ...details });
  }
}

function pdfSourcePart(base64Pdf: string): Part {
  return {
    inlineData: {
      data: base64Pdf,
      mimeType: "application/pdf",
    },
  };
}

async function requestExtraction(
  base64Pdf: string,
  improveWithAi: boolean,
  repairAttempt: boolean,
  overallSignal: AbortSignal,
  timing?: ResumeProcessingTiming,
) {
  const phase: GeminiRequestPhase = repairAttempt ? "repair" : "initial";
  const parts: Part[] = [
    {
      text: createResumeExtractionPrompt(improveWithAi, repairAttempt, "pdf"),
    },
    pdfSourcePart(base64Pdf),
  ];
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
            result.outcome === "timeout" ? "attempt_timeout" : result.outcome;
          logGeminiAttempt("model-attempt-end", {
            attemptNumber: result.attemptNumber,
            durationMs: Math.max(0, Math.round(result.durationMs)),
            inputMode: "pdf",
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
            inputMode: "pdf",
            model,
            phase,
          });
        },
        overallSignal,
      },
    );

  return {
    model,
    text: response.text?.trim() ?? "",
  };
}

function developmentAiFailureIsForced() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.RESUME_DEV_FORCE_AI_UNAVAILABLE === "1"
  );
}

export async function runSafeGeminiExtraction(
  pdfBytes: Uint8Array,
  improveWithAi: boolean,
  { timing }: ExtractPortfolioOptions = {},
): Promise<GeminiResumePipelineResult> {
  const startedAt = performance.now();

  if (process.env.NODE_ENV === "development") {
    console.info("[resume-extraction]", { stage: "gemini-start" });
  }

  if (developmentAiFailureIsForced()) {
    const result: GeminiResumePipelineResult = {
      success: false,
      source: "gemini",
      reason: "unavailable",
      error: new Error("Development-forced Gemini unavailability."),
    };
    timing?.record("gemini-total", performance.now() - startedAt, result.reason);
    return result;
  }

  const base64Pdf = timing
    ? timing.measureSync("gemini-input-preparation", () =>
        Buffer.from(
          pdfBytes.buffer,
          pdfBytes.byteOffset,
          pdfBytes.byteLength,
        ).toString("base64"),
      )
    : Buffer.from(
        pdfBytes.buffer,
        pdfBytes.byteOffset,
        pdfBytes.byteLength,
      ).toString("base64");
  const result = await runGeminiResumePipeline({
    overallTimeoutMs: GEMINI_OVERALL_TIMEOUT_MS,
    request: (repairAttempt, overallSignal) =>
      requestExtraction(
        base64Pdf,
        improveWithAi,
        repairAttempt,
        overallSignal,
        timing,
      ),
    timing,
  });
  const durationMs = performance.now() - startedAt;
  timing?.record(
    "gemini-total",
    durationMs,
    result.success ? "success" : result.reason,
  );

  if (process.env.NODE_ENV === "development") {
    console.info("[resume-extraction]", {
      stage: "gemini-total-end",
      durationMs: Math.max(0, Math.round(durationMs)),
      outcome: result.success ? "success" : result.reason,
      ...(result.success ? { model: result.model } : {}),
    });
  }

  if (!result.success && result.error) {
    logResumeExtractionError("gemini-request", result.error);
  }

  return result;
}
