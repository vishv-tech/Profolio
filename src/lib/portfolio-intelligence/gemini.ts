import "server-only";

import {
  GEMINI_MODEL_ATTEMPT_TIMEOUT_MS,
  requestWithGeminiAvailabilityFallback,
} from "@/lib/ai/gemini";
import type { GenerateStructuredContent } from "@/lib/portfolio-intelligence/service";

const PORTFOLIO_INTELLIGENCE_TIMEOUT_MS = 45_000;

export const generateStructuredPortfolioIntelligence: GenerateStructuredContent =
  async ({ jsonSchema, prompt, systemInstruction }) => {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(new Error("Portfolio intelligence timed out.")),
      PORTFOLIO_INTELLIGENCE_TIMEOUT_MS,
    );

    try {
      const { value } = await requestWithGeminiAvailabilityFallback(
        (client, model, signal) =>
          client.models.generateContent({
            model,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
              abortSignal: signal,
              httpOptions: {
                retryOptions: { attempts: 1 },
                timeout: GEMINI_MODEL_ATTEMPT_TIMEOUT_MS,
              },
              maxOutputTokens: 12_000,
              responseJsonSchema: jsonSchema,
              responseMimeType: "application/json",
              systemInstruction,
            },
          }),
        { overallSignal: controller.signal },
      );

      return value.text?.trim() ?? "";
    } finally {
      clearTimeout(timeout);
    }
  };
