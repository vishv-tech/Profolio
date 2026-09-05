import "server-only";

import { GoogleGenAI } from "@google/genai";

import { THEME_STUDIO_MODEL } from "./schema";
import type { GenerateThemeAiStructured } from "./service";

export const THEME_STUDIO_TIMEOUT_MS = 15_000;

let themeStudioClient: GoogleGenAI | null = null;

function getThemeStudioClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("AI Theme Studio is not configured.");
  }

  themeStudioClient ??= new GoogleGenAI({ apiKey });
  return themeStudioClient;
}

function logThemeStudioAttempt(
  details: Record<string, boolean | number | string>,
) {
  if (process.env.NODE_ENV === "development") {
    console.info("[theme-studio]", details);
  }
}

export const generateStructuredThemeStyle: GenerateThemeAiStructured = async ({
  jsonSchema,
  prompt,
  systemInstruction,
}) => {
  const controller = new AbortController();
  const startedAt = performance.now();
  const timeout = setTimeout(
    () => controller.abort(new Error("Theme Studio timed out.")),
    THEME_STUDIO_TIMEOUT_MS,
  );

  try {
    const response = await getThemeStudioClient().models.generateContent({
      model: THEME_STUDIO_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        abortSignal: controller.signal,
        httpOptions: {
          retryOptions: { attempts: 1 },
          timeout: THEME_STUDIO_TIMEOUT_MS,
        },
        maxOutputTokens: 800,
        responseJsonSchema: jsonSchema,
        responseMimeType: "application/json",
        systemInstruction,
      },
    });

    logThemeStudioAttempt({
      stage: "generation",
      model: THEME_STUDIO_MODEL,
      durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
      outcome: "success",
    });

    return response.text?.trim() ?? "";
  } catch {
    logThemeStudioAttempt({
      stage: "generation",
      model: THEME_STUDIO_MODEL,
      durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
      outcome: "failure",
    });
    throw new Error("AI Theme Studio is temporarily unavailable.");
  } finally {
    clearTimeout(timeout);
  }
};
