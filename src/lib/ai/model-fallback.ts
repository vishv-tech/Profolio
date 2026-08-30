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
  request: (model: TModel, signal: AbortSignal) => Promise<TValue>;
};

export type ModelFallbackResult<TModel extends string, TValue> = {
  model: TModel;
  value: TValue;
};

export type ModelAttemptStart<TModel extends string> = {
  attemptNumber: number;
  model: TModel;
};

export type ModelAttemptResult<TModel extends string> = {
  attemptNumber: number;
  durationMs: number;
  model: TModel;
  outcome: "failed" | "success" | "timeout";
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
    signals.statuses.some((status) => [500, 502, 503, 504].includes(status)) ||
    signals.codes.some((code) =>
      [
        "DEADLINE_EXCEEDED",
        "EAI_AGAIN",
        "ECONNRESET",
        "ENETUNREACH",
        "ETIMEDOUT",
        "INTERNAL",
        "UNAVAILABLE",
      ].includes(code),
    ) ||
    /\b(?:connection reset|network error|socket hang up|timed? out)\b/iu.test(
      message,
    ) ||
    clearlySignalsTransientCapacity(message)
  );
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
}: ModelFallbackOptions<TModel, TValue>): Promise<
  ModelFallbackResult<TModel, TValue>
> {
  if (models.length === 0) {
    throw new Error("At least one Gemini model must be configured.");
  }

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    const attemptNumber = index + 1;
    const startedAt = performance.now();
    onAttemptStart?.({ attemptNumber, model });

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
      });
      return { model, value };
    } catch (error) {
      const timedOut = error instanceof ModelAttemptTimeoutError;
      onAttempt?.({
        attemptNumber,
        durationMs: performance.now() - startedAt,
        model,
        outcome: timedOut ? "timeout" : "failed",
      });

      if (overallSignal?.aborted) {
        throw error;
      }

      const nextModel = models[index + 1];

      if (!nextModel || !isTransientGeminiAvailabilityError(error)) {
        throw error;
      }

      onFallback?.(model, nextModel);
    }
  }

  throw new Error("Gemini model fallback ended unexpectedly.");
}
