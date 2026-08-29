import "server-only";

import { GoogleGenAI } from "@google/genai";

import {
  runWithModelFallback,
  type ModelAttemptResult,
} from "@/lib/ai/model-fallback";

export const GEMINI_RESUME_MODELS = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
] as const;
export const GEMINI_OVERALL_TIMEOUT_MS = 120_000;
export const GEMINI_MODEL_ATTEMPT_TIMEOUT_MS = 30_000;

export type GeminiResumeModel = (typeof GEMINI_RESUME_MODELS)[number];

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (process.env.NODE_ENV === "development" && geminiClient === null) {
    console.info("[resume-extraction]", {
      stage: "gemini-config",
      configured: Boolean(apiKey),
    });
  }

  if (!apiKey) {
    throw new Error("Gemini resume extraction is not configured.");
  }

  geminiClient ??= new GoogleGenAI({ apiKey });

  return geminiClient;
}

export function requestWithGeminiAvailabilityFallback<TValue>(
  request: (
    client: GoogleGenAI,
    model: GeminiResumeModel,
    signal: AbortSignal,
  ) => Promise<TValue>,
  options: {
    onAttempt?: (result: ModelAttemptResult<GeminiResumeModel>) => void;
    overallSignal?: AbortSignal;
  } = {},
) {
  const client = getGeminiClient();

  return runWithModelFallback({
    attemptTimeoutMs: GEMINI_MODEL_ATTEMPT_TIMEOUT_MS,
    models: GEMINI_RESUME_MODELS,
    onAttempt: options.onAttempt,
    onFallback: (unavailableModel, nextModel) => {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[resume-extraction] ${unavailableModel} unavailable, trying ${nextModel}`,
        );
      }
    },
    overallSignal: options.overallSignal,
    request: (model, signal) => request(client, model, signal),
  });
}
