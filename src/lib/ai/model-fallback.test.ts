import assert from "node:assert/strict";
import test from "node:test";

import {
  isTransientGeminiAvailabilityError,
  ModelAttemptTimeoutError,
  runWithModelFallback,
} from "@/lib/ai/model-fallback";

test("returns primary success without calling additional models", async () => {
  const attempts: string[] = [];
  const result = await runWithModelFallback({
    models: ["primary", "fallback", "last"] as const,
    request: async (model) => {
      attempts.push(model);
      return `${model}-response`;
    },
  });

  assert.deepEqual(attempts, ["primary"]);
  assert.deepEqual(result, {
    model: "primary",
    value: "primary-response",
  });
});

test("falls through when the primary model is unavailable", async () => {
  const attempts: string[] = [];
  const fallbacks: string[] = [];

  const result = await runWithModelFallback({
    models: ["primary", "fallback", "last"] as const,
    request: async (model) => {
      attempts.push(model);

      if (model === "primary") {
        throw Object.assign(new Error("UNAVAILABLE"), { status: 503 });
      }

      return `${model}-response`;
    },
    onFallback: (model, nextModel) => {
      fallbacks.push(`${model}->${nextModel}`);
    },
  });

  assert.deepEqual(attempts, ["primary", "fallback"]);
  assert.deepEqual(fallbacks, ["primary->fallback"]);
  assert.deepEqual(result, {
    model: "fallback",
    value: "fallback-response",
  });
});

test("does not fall through for quota, authentication, or request failures", async () => {
  const failures = [
    Object.assign(new Error("Quota exceeded. Check your plan."), { status: 429 }),
    Object.assign(new Error("Invalid API key"), { status: 401 }),
    Object.assign(new Error("Auth service is temporarily unavailable"), {
      status: 401,
    }),
    Object.assign(new Error("Unsupported response schema"), { status: 400 }),
  ];

  for (const failure of failures) {
    const attempts: string[] = [];

    await assert.rejects(
      runWithModelFallback({
        models: ["primary", "fallback"] as const,
        request: async (model) => {
          attempts.push(model);
          throw failure;
        },
      }),
      failure,
    );

    assert.deepEqual(attempts, ["primary"]);
  }
});

test("only treats 429 as transient when model capacity is explicit", () => {
  assert.equal(
    isTransientGeminiAvailabilityError(
      Object.assign(new Error("Model capacity is temporarily unavailable."), {
        status: 429,
      }),
    ),
    true,
  );
  assert.equal(
    isTransientGeminiAvailabilityError(
      Object.assign(new Error("Resource exhausted: daily quota reached."), {
        status: 429,
      }),
    ),
    false,
  );
});

test("falls through for an explicit transient capacity 429", async () => {
  const attempts: string[] = [];
  const result = await runWithModelFallback({
    models: ["primary", "fallback"] as const,
    request: async (model) => {
      attempts.push(model);

      if (model === "primary") {
        throw Object.assign(
          new Error("Model capacity is temporarily unavailable."),
          { status: 429 },
        );
      }

      return "success";
    },
  });

  assert.deepEqual(attempts, ["primary", "fallback"]);
  assert.equal(result.model, "fallback");
});

test("recognizes SDK JSON availability details without matching other errors", () => {
  assert.equal(
    isTransientGeminiAvailabilityError(
      new Error(
        JSON.stringify({
          error: {
            code: 503,
            message: "This model is currently experiencing high demand.",
            status: "UNAVAILABLE",
          },
        }),
      ),
    ),
    true,
  );
  assert.equal(
    isTransientGeminiAvailabilityError(
      Object.assign(new Error("Invalid structured output schema"), {
        code: "INVALID_ARGUMENT",
        status: 400,
      }),
    ),
    false,
  );
});

test("reports a safe final failure when all models are transiently unavailable", async () => {
  const attempts: string[] = [];
  const finalError = Object.assign(new Error("UNAVAILABLE"), { status: 503 });

  await assert.rejects(
    runWithModelFallback({
      models: ["primary", "fallback", "last"] as const,
      request: async (model) => {
        attempts.push(model);
        throw finalError;
      },
    }),
    finalError,
  );

  assert.deepEqual(attempts, ["primary", "fallback", "last"]);
});

test("a hung model attempt times out and advances without consuming the overall budget", async () => {
  const attempts: string[] = [];
  const attemptOutcomes: string[] = [];
  const startedAt = performance.now();
  const result = await runWithModelFallback({
    attemptTimeoutMs: 25,
    models: ["primary", "fallback"] as const,
    onAttempt: ({ model, outcome }) =>
      attemptOutcomes.push(`${model}:${outcome}`),
    request: async (model) => {
      attempts.push(model);

      if (model === "primary") {
        return new Promise<string>(() => {});
      }

      return "success";
    },
  });

  assert.equal(result.model, "fallback");
  assert.deepEqual(attempts, ["primary", "fallback"]);
  assert.deepEqual(attemptOutcomes, ["primary:timeout", "fallback:success"]);
  assert.ok(performance.now() - startedAt < 500);
  assert.equal(
    isTransientGeminiAvailabilityError(
      new ModelAttemptTimeoutError("primary", 25),
    ),
    true,
  );
});

test("an SDK-style AbortError from the attempt deadline advances to the next model", async () => {
  const attempts: string[] = [];
  const starts: string[] = [];
  const outcomes: string[] = [];
  const result = await runWithModelFallback({
    attemptTimeoutMs: 25,
    models: ["primary", "fallback"] as const,
    onAttempt: ({ attemptNumber, model, outcome }) =>
      outcomes.push(`${attemptNumber}:${model}:${outcome}`),
    onAttemptStart: ({ attemptNumber, model }) =>
      starts.push(`${attemptNumber}:${model}`),
    request: async (model, signal) => {
      attempts.push(model);

      if (model === "primary") {
        return new Promise<string>((_, reject) => {
          signal.addEventListener(
            "abort",
            () =>
              reject(
                new DOMException("This operation was aborted", "AbortError"),
              ),
            { once: true },
          );
        });
      }

      return "success";
    },
  });

  assert.equal(result.model, "fallback");
  assert.deepEqual(attempts, ["primary", "fallback"]);
  assert.deepEqual(starts, ["1:primary", "2:fallback"]);
  assert.deepEqual(outcomes, ["1:primary:timeout", "2:fallback:success"]);
});

test("a normal successful request is not cancelled by its attempt timeout", async () => {
  let aborted = false;
  const result = await runWithModelFallback({
    attemptTimeoutMs: 30,
    models: ["primary", "fallback"] as const,
    request: async (model, signal) => {
      signal.addEventListener("abort", () => {
        aborted = true;
      });
      await new Promise((resolve) => setTimeout(resolve, 5));
      return model;
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(result.model, "primary");
  assert.equal(aborted, false);
});

test("the overall signal bounds the full fallback operation", async () => {
  const controller = new AbortController();
  const attempts: string[] = [];
  const overallError = new Error("overall timeout");
  const startedAt = performance.now();
  const timeout = setTimeout(() => controller.abort(overallError), 30);

  try {
    await assert.rejects(
      runWithModelFallback({
        attemptTimeoutMs: 1_000,
        models: ["primary", "fallback"] as const,
        overallSignal: controller.signal,
        request: async (model, signal) => {
          attempts.push(model);
          return new Promise<string>((_, reject) => {
            signal.addEventListener(
              "abort",
              () =>
                reject(
                  new DOMException(
                    "This operation was aborted",
                    "AbortError",
                  ),
                ),
              { once: true },
            );
          });
        },
      }),
      overallError,
    );
  } finally {
    clearTimeout(timeout);
  }

  assert.ok(performance.now() - startedAt < 500);
  assert.deepEqual(attempts, ["primary"]);
});

test("successful attempts detach from the overall signal", async () => {
  const overallController = new AbortController();
  const attemptSignals: AbortSignal[] = [];
  const result = await runWithModelFallback({
    attemptTimeoutMs: 30,
    models: ["primary"] as const,
    overallSignal: overallController.signal,
    request: async (model, signal) => {
      attemptSignals.push(signal);
      return model;
    },
  });

  overallController.abort(new Error("late overall abort"));
  await new Promise((resolve) => setTimeout(resolve, 40));

  assert.equal(result.model, "primary");
  assert.equal(attemptSignals[0]?.aborted, false);
});
