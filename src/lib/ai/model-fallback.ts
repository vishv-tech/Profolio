type ErrorSignals = {
  codes: string[];
  messages: string[];
  statuses: number[];
};

type ModelFallbackOptions<TModel extends string, TValue> = {
  models: readonly TModel[];
  request: (model: TModel) => Promise<TValue>;
  onFallback?: (unavailableModel: TModel, nextModel: TModel) => void;
};

export type ModelFallbackResult<TModel extends string, TValue> = {
  model: TModel;
  value: TValue;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
    signals.statuses.includes(503) ||
    signals.codes.includes("UNAVAILABLE") ||
    clearlySignalsTransientCapacity(message)
  );
}

export async function runWithModelFallback<
  TModel extends string,
  TValue,
>({
  models,
  request,
  onFallback,
}: ModelFallbackOptions<TModel, TValue>): Promise<
  ModelFallbackResult<TModel, TValue>
> {
  if (models.length === 0) {
    throw new Error("At least one Gemini model must be configured.");
  }

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];

    try {
      return { model, value: await request(model) };
    } catch (error) {
      const nextModel = models[index + 1];

      if (!nextModel || !isTransientGeminiAvailabilityError(error)) {
        throw error;
      }

      onFallback?.(model, nextModel);
    }
  }

  throw new Error("Gemini model fallback ended unexpectedly.");
}
