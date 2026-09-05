import "server-only";

import {
  GEMINI_RESUME_MODELS,
  requestWithGeminiAvailabilityFallback,
} from "@/lib/ai/gemini";
import { getGeminiFailureDiagnostics } from "@/lib/ai/model-fallback";
import type { GenerateStructuredContent } from "@/lib/portfolio-intelligence/service";

export const PORTFOLIO_INTELLIGENCE_MODEL_ATTEMPT_TIMEOUT_MS = 30_000;
export const UPGRADE_PLAN_TIMEOUT_MS = 45_000;
export const CONTENT_IMPROVEMENT_TIMEOUT_MS = 105_000;
export const PORTFOLIO_INTELLIGENCE_RECOVERY_BACKOFF_MS = 350;
export const PORTFOLIO_INTELLIGENCE_RECOVERY_SAFETY_MARGIN_MS = 1_000;

function logPortfolioIntelligenceAttempt(
  stage:
    | "model-attempt-end"
    | "model-attempt-start"
    | "model-fallback"
    | "recovery-backoff"
    | "recovery-evaluation",
  details: Record<string, boolean | number | string | undefined>,
) {
  if (process.env.NODE_ENV === "development") {
    console.info("[portfolio-intelligence]", { stage, ...details });
  }
}

function createPortfolioIntelligenceGenerator(
  overallTimeoutMs: number,
): GenerateStructuredContent {
  return async ({ jsonSchema, prompt, systemInstruction }) => {
    const controller = new AbortController();
    const deadlineAt = performance.now() + overallTimeoutMs;
    const timeout = setTimeout(
      () => controller.abort(new Error("Portfolio intelligence timed out.")),
      overallTimeoutMs,
    );
    const remainingBudgetMs = () =>
      Math.max(0, Math.round(deadlineAt - performance.now()));

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
                timeout: PORTFOLIO_INTELLIGENCE_MODEL_ATTEMPT_TIMEOUT_MS,
              },
              maxOutputTokens: 12_000,
              responseJsonSchema: jsonSchema,
              responseMimeType: "application/json",
              systemInstruction,
            },
          }),
        {
          attemptTimeoutMs: PORTFOLIO_INTELLIGENCE_MODEL_ATTEMPT_TIMEOUT_MS,
          onAttempt: ({
            attemptNumber,
            durationMs,
            error,
            model,
            outcome,
            recovery,
          }) => {
            logPortfolioIntelligenceAttempt("model-attempt-end", {
              attemptNumber,
              durationMs: Math.max(0, Math.round(durationMs)),
              ...(error === undefined
                ? {}
                : getGeminiFailureDiagnostics(error)),
              model,
              outcome:
                outcome === "timeout" ? "attempt_timeout" : outcome,
              remainingMs: remainingBudgetMs(),
              recovery,
            });
          },
          onAttemptStart: ({ attemptNumber, model, recovery }) => {
            logPortfolioIntelligenceAttempt("model-attempt-start", {
              attemptNumber,
              model,
              remainingMs: remainingBudgetMs(),
              recovery,
            });
          },
          onFallback: (fromModel, toModel) => {
            logPortfolioIntelligenceAttempt("model-fallback", {
              fromModel,
              remainingMs: remainingBudgetMs(),
              toModel,
            });
          },
          overallSignal: controller.signal,
          recovery: {
            backoffMs: PORTFOLIO_INTELLIGENCE_RECOVERY_BACKOFF_MS,
            deadlineAt,
            model: GEMINI_RESUME_MODELS[0],
            onBackoff: ({ durationMs }) => {
              logPortfolioIntelligenceAttempt("recovery-backoff", {
                durationMs,
              });
            },
            onEvaluation: ({ eligible, remainingMs, requiredMs }) => {
              logPortfolioIntelligenceAttempt("recovery-evaluation", {
                eligible,
                remainingMs: Math.max(0, Math.round(remainingMs)),
                requiredMs: Math.max(0, Math.round(requiredMs)),
              });
            },
            safetyMarginMs:
              PORTFOLIO_INTELLIGENCE_RECOVERY_SAFETY_MARGIN_MS,
          },
        },
      );

      return value.text?.trim() ?? "";
    } finally {
      clearTimeout(timeout);
    }
  };
}

export const generateStructuredUpgradePlan =
  createPortfolioIntelligenceGenerator(UPGRADE_PLAN_TIMEOUT_MS);

export const generateStructuredPortfolioIntelligence =
  createPortfolioIntelligenceGenerator(CONTENT_IMPROVEMENT_TIMEOUT_MS);
