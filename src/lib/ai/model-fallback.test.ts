import assert from "node:assert/strict";
import test from "node:test";

import {
  isTransientGeminiAvailabilityError,
  runWithModelFallback,
} from "@/lib/ai/model-fallback";

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
