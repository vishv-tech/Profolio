import "server-only";

import { ZodError } from "zod";

import {
  GEMINI_REQUEST_TIMEOUT_MS,
  GEMINI_RESUME_MODEL,
  getGeminiClient,
} from "@/lib/ai/gemini";
import { normalizeResumeExtraction } from "@/lib/ai/normalize-portfolio";
import {
  createResumeExtractionPrompt,
  RESUME_EXTRACTION_SYSTEM_PROMPT,
} from "@/lib/ai/prompts";
import {
  GEMINI_RESUME_EXTRACTION_JSON_SCHEMA,
  parseGeminiResumeExtraction,
  type GeminiExtractionValidationIssue,
} from "@/lib/ai/resume-schema";
import type { PortfolioData } from "@/types/portfolio";

export type ResumeExtractionStage =
  | "database-read"
  | "database-claim"
  | "storage-download"
  | "stored-pdf-validation"
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
    /([?&](?:key|api_key)=)[^&\s]+/gi,
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

async function requestExtraction(
  pdfBytes: Uint8Array,
  improveWithAi: boolean,
  repairAttempt: boolean,
) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    GEMINI_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await getGeminiClient().models.generateContent({
      model: GEMINI_RESUME_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: createResumeExtractionPrompt(improveWithAi, repairAttempt) },
            {
              inlineData: {
                data: Buffer.from(pdfBytes).toString("base64"),
                mimeType: "application/pdf",
              },
            },
          ],
        },
      ],
      config: {
        abortSignal: controller.signal,
        maxOutputTokens: 32_768,
        responseJsonSchema: GEMINI_RESUME_EXTRACTION_JSON_SCHEMA,
        responseMimeType: "application/json",
        systemInstruction: RESUME_EXTRACTION_SYSTEM_PROMPT,
      },
    });

    return response.text?.trim() ?? "";
  } catch (error) {
    throw new ResumeExtractionError(
      "gemini-request",
      "The Gemini request failed.",
      { cause: error },
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractPortfolioFromPdf(
  pdfBytes: Uint8Array,
  improveWithAi: boolean,
): Promise<PortfolioData> {
  let lastFailure: Exclude<
    ReturnType<typeof parseGeminiResumeExtraction>,
    { success: true }
  > | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const responseText = await requestExtraction(
      pdfBytes,
      improveWithAi,
      attempt === 1,
    );
    const parsed = parseGeminiResumeExtraction(responseText);

    if (parsed.success) {
      try {
        return normalizeResumeExtraction(parsed.data);
      } catch (error) {
        throw new ResumeExtractionError(
          error instanceof ZodError
            ? "portfolio-validation"
            : "normalization",
          "The extracted resume could not be normalized.",
          { cause: error },
        );
      }
    }

    lastFailure = parsed;
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
