export const GEMINI_SCHEMA_REPAIR_MIN_BUDGET_MS = 5_000;

export class GeminiOverallTimeoutError extends Error {
  constructor(readonly timeoutMs: number) {
    super(`Gemini resume extraction exceeded ${timeoutMs}ms.`);
    this.name = "GeminiOverallTimeoutError";
  }
}

export function remainingGeminiBudgetMs(
  deadlineMs: number,
  nowMs = performance.now(),
) {
  return Math.max(0, deadlineMs - nowMs);
}

export function canStartSchemaRepair(
  deadlineMs: number,
  nowMs = performance.now(),
) {
  return (
    remainingGeminiBudgetMs(deadlineMs, nowMs) >=
    GEMINI_SCHEMA_REPAIR_MIN_BUDGET_MS
  );
}
