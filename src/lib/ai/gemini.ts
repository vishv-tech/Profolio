import "server-only";

import { GoogleGenAI } from "@google/genai";

import {
  runWithModelFallback,
  type ModelAttemptResult,
  type ModelAttemptStart,
  type ModelRecoveryOptions,
} from "@/lib/ai/model-fallback";

export const GEMINI_RESUME_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
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
    attemptTimeoutMs?: number;
    onAttempt?: (result: ModelAttemptResult<GeminiResumeModel>) => void;
    onAttemptStart?: (attempt: ModelAttemptStart<GeminiResumeModel>) => void;
    onFallback?: (
      unavailableModel: GeminiResumeModel,
      nextModel: GeminiResumeModel,
    ) => void;
    overallSignal?: AbortSignal;
    recovery?: ModelRecoveryOptions<GeminiResumeModel>;
  } = {},
) {
  const client = getGeminiClient();

  return runWithModelFallback({
    attemptTimeoutMs:
      options.attemptTimeoutMs ?? GEMINI_MODEL_ATTEMPT_TIMEOUT_MS,
    models: GEMINI_RESUME_MODELS,
    onAttempt: options.onAttempt,
    onAttemptStart: options.onAttemptStart,
    onFallback: options.onFallback,
    overallSignal: options.overallSignal,
    recovery: options.recovery,
    request: (model, signal) => request(client, model, signal),
  });
}
