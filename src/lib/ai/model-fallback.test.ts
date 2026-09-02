import assert from "node:assert/strict";
import test from "node:test";

import {
  getGeminiFailureDiagnostics,
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
    Object.assign(new Error("Permission denied"), { status: 403 }),
    Object.assign(new Error("Model not found"), { status: 404 }),
    Object.assign(new Error("Invalid request schema"), { status: 422 }),
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

test("falls through for retryable provider and gateway failures", async () => {
  for (const status of [500, 502, 503, 504]) {
    const attempts: string[] = [];
    const result = await runWithModelFallback({
      models: ["primary", "fallback"] as const,
      request: async (model) => {
        attempts.push(model);

        if (model === "primary") {
          throw Object.assign(new Error("Temporary provider failure"), {
            status,
          });
        }

        return "success";
      },
    });

    assert.deepEqual(attempts, ["primary", "fallback"]);
    assert.equal(result.model, "fallback");
  }
});

test("reaches the final model after two distinct transient failures", async () => {
  const attempts: string[] = [];
  const result = await runWithModelFallback({
    models: [
      "gemini-3.5-flash",
      "gemini-3.6-flash",
      "gemini-3.7-flash",
    ] as const,
    request: async (model) => {
      attempts.push(model);

      if (model === "gemini-3.5-flash") {
        throw Object.assign(new Error("Internal provider failure"), {
          status: 500,
        });
      }

      if (model === "gemini-3.6-flash") {
        throw Object.assign(new Error("Gateway timed out"), { status: 504 });
      }

      return "success";
    },
  });

  assert.deepEqual(attempts, [
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
  ]);
  assert.equal(result.model, "gemini-3.7-flash");
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
  const failures = {
    primary: Object.assign(new Error("Internal provider failure"), {
      status: 500,
    }),
    fallback: Object.assign(new Error("Bad gateway"), { status: 502 }),
    last: Object.assign(new Error("Service unavailable"), { status: 503 }),
  };

  await assert.rejects(
    runWithModelFallback({
      models: ["primary", "fallback", "last"] as const,
      request: async (model) => {
        attempts.push(model);
        throw failures[model];
      },
    }),
    failures.last,
  );

  assert.deepEqual(attempts, ["primary", "fallback", "last"]);
});

test("recovery-enabled requests stop at the first successful model", async () => {
  for (const successAttempt of [1, 2, 3]) {
    const attempts: string[] = [];
    let recoveryEvaluations = 0;
    const result = await runWithModelFallback({
      attemptTimeoutMs: 20,
      models: ["primary", "fallback", "last"] as const,
      recovery: {
        backoffMs: 1,
        deadlineAt: performance.now() + 1_000,
        model: "primary",
        onEvaluation: () => {
          recoveryEvaluations += 1;
        },
        safetyMarginMs: 5,
      },
      request: async (model) => {
        attempts.push(model);

        if (attempts.length < successAttempt) {
          throw Object.assign(new Error("Temporary provider failure"), {
            status: 503,
          });
        }

        return `${model}-success`;
      },
    });

    assert.equal(attempts.length, successAttempt);
    assert.equal(result.model, attempts.at(-1));
    assert.equal(recoveryEvaluations, 0);
  }
});

test("a permanent primary failure bypasses fallbacks and configured recovery", async () => {
  const attempts: string[] = [];
  let recoveryEvaluations = 0;
  const permanentError = Object.assign(new Error("Invalid API key"), {
    status: 401,
  });

  await assert.rejects(
    runWithModelFallback({
      attemptTimeoutMs: 20,
      models: ["primary", "fallback", "last"] as const,
      recovery: {
        backoffMs: 1,
        deadlineAt: performance.now() + 1_000,
        model: "primary",
        onEvaluation: () => {
          recoveryEvaluations += 1;
        },
        safetyMarginMs: 5,
      },
      request: async (model) => {
        attempts.push(model);
        throw permanentError;
      },
    }),
    permanentError,
  );

  assert.deepEqual(attempts, ["primary"]);
  assert.equal(recoveryEvaluations, 0);
});

test("runs one primary recovery after the full transient chain when the deadline allows it", async () => {
  const attempts: string[] = [];
  const starts: string[] = [];
  const evaluations: Array<{ eligible: boolean; requiredMs: number }> = [];
  const backoffs: number[] = [];
  const result = await runWithModelFallback({
    attemptTimeoutMs: 20,
    models: ["primary", "fallback", "last"] as const,
    onAttemptStart: ({ attemptNumber, model, recovery }) => {
      starts.push(`${attemptNumber}:${model}:${recovery}`);
    },
    recovery: {
      backoffMs: 1,
      deadlineAt: performance.now() + 1_000,
      model: "primary",
      onBackoff: ({ durationMs }) => backoffs.push(durationMs),
      onEvaluation: ({ eligible, requiredMs }) => {
        evaluations.push({ eligible, requiredMs });
      },
      safetyMarginMs: 5,
    },
    request: async (model) => {
      attempts.push(model);

      if (attempts.length <= 3) {
        throw Object.assign(new Error("Temporarily unavailable"), {
          status: 503,
        });
      }

      return "recovered";
    },
  });

  assert.deepEqual(attempts, ["primary", "fallback", "last", "primary"]);
  assert.deepEqual(starts, [
    "1:primary:false",
    "2:fallback:false",
    "3:last:false",
    "4:primary:true",
  ]);
  assert.deepEqual(evaluations, [{ eligible: true, requiredMs: 26 }]);
  assert.deepEqual(backoffs, [1]);
  assert.deepEqual(result, { model: "primary", value: "recovered" });
});

test("stops after one failed recovery instead of restarting the fallback chain", async () => {
  const attempts: string[] = [];
  const recoveryError = Object.assign(
    new Error("Recovery is still unavailable"),
    { status: 503 },
  );

  await assert.rejects(
    runWithModelFallback({
      attemptTimeoutMs: 20,
      models: ["primary", "fallback", "last"] as const,
      recovery: {
        backoffMs: 1,
        deadlineAt: performance.now() + 1_000,
        model: "primary",
        safetyMarginMs: 5,
      },
      request: async (model) => {
        attempts.push(model);

        if (attempts.length === 4) {
          throw recoveryError;
        }

        throw Object.assign(new Error(`${model} unavailable`), { status: 503 });
      },
    }),
    recoveryError,
  );

  assert.deepEqual(attempts, ["primary", "fallback", "last", "primary"]);
});

test("does not start recovery when the original deadline has too little time", async () => {
  const attempts: string[] = [];
  const evaluations: boolean[] = [];
  const finalError = Object.assign(new Error("Last model unavailable"), {
    status: 503,
  });

  await assert.rejects(
    runWithModelFallback({
      attemptTimeoutMs: 20,
      models: ["primary", "fallback", "last"] as const,
      recovery: {
        backoffMs: 5,
        deadlineAt: performance.now() + 10,
        model: "primary",
        onEvaluation: ({ eligible }) => evaluations.push(eligible),
        safetyMarginMs: 5,
      },
      request: async (model) => {
        attempts.push(model);

        if (model === "last") {
          throw finalError;
        }

        throw Object.assign(new Error(`${model} unavailable`), { status: 503 });
      },
    }),
    finalError,
  );

  assert.deepEqual(attempts, ["primary", "fallback", "last"]);
  assert.deepEqual(evaluations, [false]);
});

test("exposes safe structured diagnostics without provider message content", () => {
  assert.deepEqual(
    getGeminiFailureDiagnostics(
      Object.assign(new Error("Sensitive provider detail"), {
        code: "UNAVAILABLE",
        status: 503,
      }),
    ),
    {
      errorName: "Error",
      fallbackReason: "provider-server-error",
      httpStatus: 503,
      providerCode: "UNAVAILABLE",
      transient: true,
    },
  );
  assert.deepEqual(
    getGeminiFailureDiagnostics(new ModelAttemptTimeoutError("primary", 20)),
    {
      errorName: "ModelAttemptTimeoutError",
      fallbackReason: "attempt-timeout",
      transient: true,
    },
  );
  assert.deepEqual(
    getGeminiFailureDiagnostics(
      Object.assign(new Error("Invalid credentials"), { status: 401 }),
    ),
    {
      errorName: "Error",
      fallbackReason: "terminal",
      httpStatus: 401,
      transient: false,
    },
  );
  assert.deepEqual(
    getGeminiFailureDiagnostics(
      Object.assign(new Error("Daily quota exhausted"), { status: 429 }),
    ),
    {
      errorName: "Error",
      fallbackReason: "terminal",
      httpStatus: 429,
      transient: false,
    },
  );
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

test("the overall signal stops recovery during its bounded backoff", async () => {
  const controller = new AbortController();
  const attempts: string[] = [];
  const overallError = new Error("overall timeout");

  await assert.rejects(
    runWithModelFallback({
      attemptTimeoutMs: 20,
      models: ["primary", "fallback", "last"] as const,
      overallSignal: controller.signal,
      recovery: {
        backoffMs: 10,
        deadlineAt: performance.now() + 1_000,
        model: "primary",
        onBackoff: () => controller.abort(overallError),
        safetyMarginMs: 5,
      },
      request: async (model) => {
        attempts.push(model);
        throw Object.assign(new Error("Temporary provider failure"), {
          status: 503,
        });
      },
    }),
    overallError,
  );

  assert.deepEqual(attempts, ["primary", "fallback", "last"]);
});

test("the overall signal aborts an in-flight recovery request", async () => {
  const controller = new AbortController();
  const attempts: string[] = [];
  const overallError = new Error("overall timeout");

  await assert.rejects(
    runWithModelFallback({
      attemptTimeoutMs: 50,
      models: ["primary", "fallback", "last"] as const,
      overallSignal: controller.signal,
      recovery: {
        backoffMs: 0,
        deadlineAt: performance.now() + 1_000,
        model: "primary",
        safetyMarginMs: 5,
      },
      request: async (model, signal) => {
        attempts.push(model);

        if (attempts.length <= 3) {
          throw Object.assign(new Error("Temporary provider failure"), {
            status: 503,
          });
        }

        return new Promise<string>((_, reject) => {
          signal.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
          setTimeout(() => controller.abort(overallError), 5);
        });
      },
    }),
    overallError,
  );

  assert.deepEqual(attempts, ["primary", "fallback", "last", "primary"]);
});

test("a pre-aborted overall signal starts no model request", async () => {
  const controller = new AbortController();
  const overallError = new Error("overall timeout");
  const attempts: string[] = [];
  controller.abort(overallError);

  await assert.rejects(
    runWithModelFallback({
      attemptTimeoutMs: 1_000,
      models: ["primary", "fallback"] as const,
      overallSignal: controller.signal,
      request: async (model) => {
        attempts.push(model);
        return "unexpected";
      },
    }),
    overallError,
  );

  assert.deepEqual(attempts, []);
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
