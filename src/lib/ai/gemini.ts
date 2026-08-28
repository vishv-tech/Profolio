import "server-only";

import { GoogleGenAI } from "@google/genai";

export const GEMINI_RESUME_MODEL = "gemini-3.7-flash";
export const GEMINI_REQUEST_TIMEOUT_MS = 120_000;

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
