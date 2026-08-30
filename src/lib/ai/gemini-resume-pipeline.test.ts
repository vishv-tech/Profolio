import assert from "node:assert/strict";
import test from "node:test";

import { GeminiConfigurationError } from "@/lib/ai/extraction-errors";
import {
  classifyGeminiPipelineError,
  runGeminiResumePipeline,
} from "@/lib/ai/gemini-resume-pipeline";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";

const VALID_EXTRACTION = JSON.stringify({
  personal: {
    fullName: "Gemini Avery",
    headline: "Developer",
    email: "avery@example.com",
    phone: "",
    location: "",
  },
  summary: "Builds carefully tested software.",
  experience: [],
  education: [],
  projects: [],
  skills: [],
  achievements: [],
  certifications: [],
  links: [],
  languages: [],
  interests: [],
  customSections: [],
});

test("returns schema-valid Gemini PortfolioData with the winning model", async () => {
  const result = await runGeminiResumePipeline({
    overallTimeoutMs: 1_000,
    request: async () => ({ model: "primary", text: VALID_EXTRACTION }),
  });

  assert.equal(result.success, true);

  if (result.success) {
    assert.equal(result.model, "primary");
    assert.equal(result.data.personal.fullName, "Gemini Avery");
    assert.equal(PortfolioDataSchema.safeParse(result.data).success, true);
  }
});

test("repairs one invalid structured response within the shared budget", async () => {
  const phases: boolean[] = [];
  const result = await runGeminiResumePipeline({
    canRepair: () => true,
    overallTimeoutMs: 1_000,
    request: async (repairAttempt) => {
      phases.push(repairAttempt);
      return {
        model: repairAttempt ? "repair-model" : "primary",
        text: repairAttempt ? VALID_EXTRACTION : "not-json",
      };
    },
  });

  assert.equal(result.success, true);
  assert.deepEqual(phases, [false, true]);
  if (result.success) {
    assert.equal(result.model, "repair-model");
  }
});

test("returns structured permanent and missing-configuration failures", async () => {
  const permanent = await runGeminiResumePipeline({
    overallTimeoutMs: 1_000,
    request: async () => {
      throw Object.assign(new Error("Invalid request"), { status: 400 });
    },
  });
  const unconfigured = await runGeminiResumePipeline({
    overallTimeoutMs: 1_000,
    request: async () => {
      throw new GeminiConfigurationError();
    },
  });

  assert.equal(permanent.success, false);
  assert.equal(
    permanent.success ? "" : permanent.reason,
    "permanent-error",
  );
  assert.equal(unconfigured.success, false);
  assert.equal(unconfigured.success ? "" : unconfigured.reason, "unconfigured");
});

test("overall timeout resolves even when the injected request never settles", async () => {
  const startedAt = performance.now();
  const result = await runGeminiResumePipeline({
    overallTimeoutMs: 25,
    request: async () => new Promise(() => {}),
  });

  assert.equal(result.success, false);
  assert.equal(result.success ? "" : result.reason, "timeout");
  assert.ok(performance.now() - startedAt < 500);
});

test("two invalid responses produce a structured validation failure", async () => {
  const result = await runGeminiResumePipeline({
    canRepair: () => true,
    overallTimeoutMs: 1_000,
    request: async () => ({ model: "primary", text: "{}" }),
  });

  assert.equal(result.success, false);
  assert.equal(result.success ? "" : result.reason, "invalid-response");
  if (!result.success) {
    assert.ok((result.issues?.length ?? 0) > 0);
  }
});

test("classifies transient availability separately from permanent errors", () => {
  assert.equal(
    classifyGeminiPipelineError(
      Object.assign(new Error("Gateway timeout"), { status: 504 }),
    ),
    "unavailable",
  );
  assert.equal(
    classifyGeminiPipelineError(
      Object.assign(new Error("Invalid API key"), { status: 401 }),
    ),
    "permanent-error",
  );
});
