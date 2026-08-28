import "server-only";

import { GoogleGenAI } from "@google/genai";

import { runWithModelFallback } from "@/lib/ai/model-fallback";

export const GEMINI_RESUME_MODELS = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
] as const;
export const GEMINI_REQUEST_TIMEOUT_MS = 120_000;

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
  request: (client: GoogleGenAI, model: GeminiResumeModel) => Promise<TValue>,
) {
  const client = getGeminiClient();

  return runWithModelFallback({
    models: GEMINI_RESUME_MODELS,
    request: (model) => request(client, model),
    onFallback: (unavailableModel, nextModel) => {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[resume-extraction] ${unavailableModel} unavailable, trying ${nextModel}`,
        );
      }
    },
  });
}
