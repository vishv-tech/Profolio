type ErrorSignals = {
  codes: string[];
  messages: string[];
  statuses: number[];
};

type ModelFallbackOptions<TModel extends string, TValue> = {
  attemptTimeoutMs?: number;
  models: readonly TModel[];
  onAttempt?: (result: ModelAttemptResult<TModel>) => void;
  onAttemptStart?: (attempt: ModelAttemptStart<TModel>) => void;
  onFallback?: (unavailableModel: TModel, nextModel: TModel) => void;
  overallSignal?: AbortSignal;
  recovery?: ModelRecoveryOptions<TModel>;
  request: (model: TModel, signal: AbortSignal) => Promise<TValue>;
};

export type ModelRecoveryOptions<TModel extends string> = {
  backoffMs: number;
  deadlineAt: number;
  model: TModel;
  onBackoff?: (details: { durationMs: number }) => void;
  onEvaluation?: (details: ModelRecoveryEvaluation) => void;
  safetyMarginMs: number;
};

export type ModelRecoveryEvaluation = {
  eligible: boolean;
  remainingMs: number;
  requiredMs: number;
};

export type ModelFallbackResult<TModel extends string, TValue> = {
  model: TModel;
  value: TValue;
};

export type ModelAttemptStart<TModel extends string> = {
  attemptNumber: number;
  model: TModel;
  recovery: boolean;
};

export type ModelAttemptResult<TModel extends string> = {
  attemptNumber: number;
  durationMs: number;
  error?: unknown;
  model: TModel;
  outcome: "failed" | "success" | "timeout";
  recovery: boolean;
};

export type GeminiFailureDiagnostics = {
  errorName: string;
  fallbackReason:
    | "attempt-timeout"
    | "capacity"
    | "provider-server-error"
    | "provider-unavailable"
    | "terminal";
  httpStatus?: number;
  providerCode?: string;
  transient: boolean;
};

export class ModelAttemptTimeoutError extends Error {
  constructor(
    readonly model: string,
    readonly timeoutMs: number,
  ) {
    super(`Gemini model attempt exceeded ${timeoutMs}ms.`);
    this.name = "ModelAttemptTimeoutError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAbortError(error: unknown) {
  return isRecord(error) && error.name === "AbortError";
}

function collectErrorSignals(
  value: unknown,
  signals: ErrorSignals,
  depth = 0,
) {
  if (depth > 3) {
    return;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return;
    }

    signals.messages.push(trimmed);

    if (trimmed.startsWith("{")) {
      try {
        collectErrorSignals(JSON.parse(trimmed), signals, depth + 1);
      } catch {
        // The SDK often puts JSON in Error.message, but plain messages are valid too.
      }
    }

    return;
  }

  if (!isRecord(value)) {
    return;
  }

  const status = value.status ?? value.statusCode;
  if (typeof status === "number") {
    signals.statuses.push(status);
  } else if (typeof status === "string") {
    const numericStatus = Number(status);
    if (Number.isInteger(numericStatus)) {
      signals.statuses.push(numericStatus);
    } else {
      signals.codes.push(status.toUpperCase());
    }
  }

  if (typeof value.code === "number") {
    signals.statuses.push(value.code);
  } else if (typeof value.code === "string") {
    signals.codes.push(value.code.toUpperCase());
  }

  collectErrorSignals(value.message, signals, depth + 1);
  collectErrorSignals(value.error, signals, depth + 1);
  collectErrorSignals(value.response, signals, depth + 1);
}

function clearlySignalsTransientCapacity(message: string) {
  return (
    /\bhigh demand\b/i.test(message) ||
    /\btemporar(?:y|ily)\s+(?:overload(?:ed)?|unavailable)\b/i.test(message) ||
    /\b(?:model|service|provider)\b.{0,80}\b(?:capacity|overload(?:ed)?|temporarily unavailable)\b/i.test(
      message,
    ) ||
    /\b(?:capacity|overload(?:ed)?)\b.{0,80}\b(?:model|service|provider)\b/i.test(
      message,
    )
  );
}

export function isTransientGeminiAvailabilityError(error: unknown) {
  if (error instanceof ModelAttemptTimeoutError) {
    return true;
  }

  const signals: ErrorSignals = { codes: [], messages: [], statuses: [] };
  collectErrorSignals(error, signals);

  const message = signals.messages.join("\n");

  if (signals.statuses.includes(429)) {
    return clearlySignalsTransientCapacity(message);
  }

  if (
    signals.statuses.some((status) =>
      [400, 401, 403, 404, 422].includes(status),
    )
  ) {
    return false;
  }

  return (
    signals.statuses.some((status) =>
      [500, 502, 503, 504].includes(status),
    ) ||
    signals.codes.includes("UNAVAILABLE") ||
    clearlySignalsTransientCapacity(message)
  );
}

export function getGeminiFailureDiagnostics(
  error: unknown,
): GeminiFailureDiagnostics {
  const signals: ErrorSignals = { codes: [], messages: [], statuses: [] };
  collectErrorSignals(error, signals);

  const message = signals.messages.join("\n");
  const httpStatus = signals.statuses[0];
  const providerCode = signals.codes[0];
  const transient = isTransientGeminiAvailabilityError(error);
  let fallbackReason: GeminiFailureDiagnostics["fallbackReason"] = "terminal";

  if (error instanceof ModelAttemptTimeoutError) {
    fallbackReason = "attempt-timeout";
  } else if (clearlySignalsTransientCapacity(message)) {
    fallbackReason = "capacity";
  } else if (
    signals.statuses.some((status) => [500, 502, 503, 504].includes(status))
  ) {
    fallbackReason = "provider-server-error";
  } else if (signals.codes.includes("UNAVAILABLE")) {
    fallbackReason = "provider-unavailable";
  }

  return {
    errorName:
      isRecord(error) && typeof error.name === "string" && error.name.trim()
        ? error.name
        : "UnknownError",
    fallbackReason,
    ...(httpStatus === undefined ? {} : { httpStatus }),
    ...(providerCode === undefined ? {} : { providerCode }),
    transient,
  };
}

async function waitForBackoff(
  durationMs: number,
  overallSignal: AbortSignal | undefined,
) {
  if (overallSignal?.aborted) {
    throw overallSignal.reason ?? new Error("Gemini request was aborted.");
  }

  if (durationMs <= 0) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const finish = () => {
      overallSignal?.removeEventListener("abort", abort);
      resolve();
    };
    const abort = () => {
      clearTimeout(timeout);
      reject(
        overallSignal?.reason ?? new Error("Gemini request was aborted."),
      );
    };
    const timeout = setTimeout(finish, durationMs);

    overallSignal?.addEventListener("abort", abort, { once: true });
  });
}

async function requestWithAttemptTimeout<TModel extends string, TValue>(
  model: TModel,
  request: (model: TModel, signal: AbortSignal) => Promise<TValue>,
  attemptTimeoutMs: number | undefined,
  overallSignal: AbortSignal | undefined,
) {
  if (overallSignal?.aborted) {
    throw overallSignal.reason ?? new Error("Gemini request was aborted.");
  }

  const attemptController = new AbortController();
  let timedOut = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let rejectOverall: ((reason?: unknown) => void) | undefined;

  const abortAttempt = () => {
    attemptController.abort(overallSignal?.reason);
    rejectOverall?.(
      overallSignal?.reason ?? new Error("Gemini request was aborted."),
    );
  };

  const contenders: Promise<TValue>[] = [
    request(model, attemptController.signal),
  ];

  if (overallSignal) {
    contenders.push(
      new Promise<TValue>((_, reject) => {
        rejectOverall = reject;
        overallSignal.addEventListener("abort", abortAttempt, { once: true });
      }),
    );
  }

  if (attemptTimeoutMs !== undefined) {
    contenders.push(
      new Promise<TValue>((_, reject) => {
        timeout = setTimeout(() => {
          timedOut = true;
          const error = new ModelAttemptTimeoutError(model, attemptTimeoutMs);
          attemptController.abort(error);
          reject(error);
        }, attemptTimeoutMs);
      }),
    );
  }

  try {
    return await Promise.race(contenders);
  } catch (error) {
    if (overallSignal?.aborted) {
      throw overallSignal.reason ?? error;
    }

    if (
      attemptTimeoutMs !== undefined &&
      (timedOut || isAbortError(error))
    ) {
      throw new ModelAttemptTimeoutError(model, attemptTimeoutMs!);
    }

    throw error;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }

    overallSignal?.removeEventListener("abort", abortAttempt);
  }
}

export async function runWithModelFallback<
  TModel extends string,
  TValue,
>({
  attemptTimeoutMs,
  models,
  onAttempt,
  onAttemptStart,
  request,
  onFallback,
  overallSignal,
  recovery,
}: ModelFallbackOptions<TModel, TValue>): Promise<
  ModelFallbackResult<TModel, TValue>
> {
  if (models.length === 0) {
    throw new Error("At least one Gemini model must be configured.");
  }

  let exhaustedTransientChain = false;
  let finalTransientError: unknown;

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    const attemptNumber = index + 1;
    const startedAt = performance.now();
    onAttemptStart?.({ attemptNumber, model, recovery: false });

    try {
      const value = await requestWithAttemptTimeout(
        model,
        request,
        attemptTimeoutMs,
        overallSignal,
      );
      onAttempt?.({
        attemptNumber,
        durationMs: performance.now() - startedAt,
        model,
        outcome: "success",
        recovery: false,
      });
      return { model, value };
    } catch (error) {
      const timedOut = error instanceof ModelAttemptTimeoutError;
      onAttempt?.({
        attemptNumber,
        durationMs: performance.now() - startedAt,
        error,
        model,
        outcome: timedOut ? "timeout" : "failed",
        recovery: false,
      });

      if (overallSignal?.aborted) {
        throw error;
      }

      const nextModel = models[index + 1];
      const transient = isTransientGeminiAvailabilityError(error);

      if (!transient) {
        throw error;
      }

      if (nextModel) {
        onFallback?.(model, nextModel);
        continue;
      }

      if (!recovery) {
        throw error;
      }

      exhaustedTransientChain = true;
      finalTransientError = error;
      break;
    }
  }

  if (recovery && exhaustedTransientChain) {
    if (overallSignal?.aborted) {
      throw overallSignal.reason ?? finalTransientError;
    }

    const backoffMs = Math.max(0, recovery.backoffMs);
    const safetyMarginMs = Math.max(0, recovery.safetyMarginMs);
    const attemptBudgetMs = attemptTimeoutMs ?? Number.POSITIVE_INFINITY;
    const remainingMs = Math.max(0, recovery.deadlineAt - performance.now());
    const requiredMs = backoffMs + attemptBudgetMs + safetyMarginMs;
    const eligible =
      Number.isFinite(requiredMs) && remainingMs >= requiredMs;

    recovery.onEvaluation?.({ eligible, remainingMs, requiredMs });

    if (!eligible) {
      throw finalTransientError;
    }

    recovery.onBackoff?.({ durationMs: backoffMs });
    await waitForBackoff(backoffMs, overallSignal);

    const remainingAfterBackoffMs = Math.max(
      0,
      recovery.deadlineAt - performance.now(),
    );

    if (remainingAfterBackoffMs < attemptBudgetMs + safetyMarginMs) {
      recovery.onEvaluation?.({
        eligible: false,
        remainingMs: remainingAfterBackoffMs,
        requiredMs: attemptBudgetMs + safetyMarginMs,
      });
      throw finalTransientError;
    }

    const attemptNumber = models.length + 1;
    const startedAt = performance.now();
    onAttemptStart?.({
      attemptNumber,
      model: recovery.model,
      recovery: true,
    });

    try {
      const value = await requestWithAttemptTimeout(
        recovery.model,
        request,
        attemptBudgetMs,
        overallSignal,
      );
      onAttempt?.({
        attemptNumber,
        durationMs: performance.now() - startedAt,
        model: recovery.model,
        outcome: "success",
        recovery: true,
      });
      return { model: recovery.model, value };
    } catch (error) {
      const timedOut = error instanceof ModelAttemptTimeoutError;
      onAttempt?.({
        attemptNumber,
        durationMs: performance.now() - startedAt,
        error,
        model: recovery.model,
        outcome: timedOut ? "timeout" : "failed",
        recovery: true,
      });
      throw error;
    }
  }

  throw new Error("Gemini model fallback ended unexpectedly.");
}
