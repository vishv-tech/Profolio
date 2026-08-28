import "server-only";

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
} from "@/lib/ai/resume-schema";
import type { PortfolioData } from "@/types/portfolio";

export class ResumeExtractionError extends Error {
  constructor() {
    super("The resume could not be extracted into a valid portfolio.");
    this.name = "ResumeExtractionError";
  }
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
        candidateCount: 1,
        maxOutputTokens: 32_768,
        responseJsonSchema: GEMINI_RESUME_EXTRACTION_JSON_SCHEMA,
        responseMimeType: "application/json",
        systemInstruction: RESUME_EXTRACTION_SYSTEM_PROMPT,
        temperature: 0.1,
      },
    });

    return response.text?.trim() ?? "";
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractPortfolioFromPdf(
  pdfBytes: Uint8Array,
  improveWithAi: boolean,
): Promise<PortfolioData> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const responseText = await requestExtraction(
      pdfBytes,
      improveWithAi,
      attempt === 1,
    );
    const parsed = parseGeminiResumeExtraction(responseText);

    if (parsed.success) {
      return normalizeResumeExtraction(parsed.data);
    }
  }

  throw new ResumeExtractionError();
}
