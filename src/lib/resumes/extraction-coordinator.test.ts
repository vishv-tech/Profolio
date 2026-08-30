import assert from "node:assert/strict";
import test from "node:test";

import type { GeminiResumePipelineResult } from "@/lib/ai/gemini-resume-pipeline";
import { createEmptyPortfolioData } from "@/lib/portfolios/defaults";
import type { DeterministicExtractionResult } from "@/lib/resumes/deterministic-pipeline";
import { coordinateResumeExtraction } from "@/lib/resumes/extraction-coordinator";

function deferred<TValue>() {
  let resolve!: (value: TValue) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<TValue>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

function portfolio(name: string) {
  const data = createEmptyPortfolioData();
  data.personal.fullName = name;
  return data;
}

function deterministicSuccess(
  name = "Deterministic Avery",
): DeterministicExtractionResult {
  return {
    success: true,
    source: "deterministic",
    data: portfolio(name),
    pageCount: 1,
    textCharacters: 500,
  };
}

function deterministicFailure(): DeterministicExtractionResult {
  return {
    success: false,
    source: "deterministic",
    reason: "unusable-text",
  };
}

function geminiSuccess(name = "Gemini Avery"): GeminiResumePipelineResult {
  return {
    success: true,
    source: "gemini",
    data: portfolio(name),
    model: "primary",
  };
}

function geminiFailure(
  reason: "permanent-error" | "timeout" | "unavailable" | "unconfigured" =
    "unavailable",
): GeminiResumePipelineResult {
  return { success: false, source: "gemini", reason };
}

test("starts deterministic and Gemini branches before either completes", async () => {
  const starts: string[] = [];
  const deterministic = deferred<DeterministicExtractionResult>();
  const gemini = deferred<GeminiResumePipelineResult>();
  const resultPromise = coordinateResumeExtraction({
    improveWithAi: false,
    onBranchStart: (source) => starts.push(source),
    pdfBytes: new Uint8Array([1]),
    runDeterministic: () => deterministic.promise,
    runGemini: () => gemini.promise,
  });

  assert.deepEqual(starts, ["deterministic", "gemini"]);
  deterministic.resolve(deterministicSuccess());
  gemini.resolve(geminiSuccess());

  const result = await resultPromise;
  assert.equal(result.success, true);
});

test("waits for and returns Gemini when deterministic finishes first", async () => {
  const gemini = deferred<GeminiResumePipelineResult>();
  let settled = false;
  const geminiData = portfolio("Gemini wins unchanged");
  const resultPromise = coordinateResumeExtraction({
    improveWithAi: true,
    pdfBytes: new Uint8Array([1]),
    runDeterministic: async () => deterministicSuccess("Local result"),
    runGemini: () => gemini.promise,
  }).then((result) => {
    settled = true;
    return result;
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(settled, false);
  gemini.resolve({
    success: true,
    source: "gemini",
    data: geminiData,
    model: "primary",
  });

  const result = await resultPromise;
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.source, "gemini");
    assert.strictEqual(result.data, geminiData);
  }
});

test("Gemini success does not wait for or expose a later deterministic failure", async () => {
  const deterministic = deferred<DeterministicExtractionResult>();
  const result = await coordinateResumeExtraction({
    improveWithAi: false,
    pdfBytes: new Uint8Array([1]),
    runDeterministic: () => deterministic.promise,
    runGemini: async () => geminiSuccess(),
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.source, "gemini");
  }

  deterministic.reject(new Error("late deterministic rejection"));
  await new Promise((resolve) => setImmediate(resolve));
});

test("uses deterministic data only after every Gemini attempt fails", async () => {
  const deterministicData = portfolio("Fallback Avery");
  const result = await coordinateResumeExtraction({
    improveWithAi: true,
    pdfBytes: new Uint8Array([1]),
    runDeterministic: async () => ({
      ...deterministicSuccess(),
      data: deterministicData,
    }),
    runGemini: async () => geminiFailure("timeout"),
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.source, "deterministic");
    assert.strictEqual(result.data, deterministicData);
  }
});

test("uses Gemini for scanned PDFs and missing deterministic text", async () => {
  const result = await coordinateResumeExtraction({
    improveWithAi: false,
    pdfBytes: new Uint8Array([1]),
    runDeterministic: async () => deterministicFailure(),
    runGemini: async () => geminiSuccess(),
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.source, "gemini");
  }
});

test("missing Gemini configuration still allows deterministic success", async () => {
  const result = await coordinateResumeExtraction({
    improveWithAi: false,
    pdfBytes: new Uint8Array([1]),
    runDeterministic: async () => deterministicSuccess(),
    runGemini: async () => geminiFailure("unconfigured"),
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.source, "deterministic");
  }
});

test("reports genuine failure when neither branch has usable data", async () => {
  const result = await coordinateResumeExtraction({
    improveWithAi: false,
    pdfBytes: new Uint8Array([1]),
    runDeterministic: async () => deterministicFailure(),
    runGemini: async () => geminiFailure("permanent-error"),
  });

  assert.deepEqual(result, {
    success: false,
    reason: "all-extraction-failed",
    deterministic: deterministicFailure(),
    gemini: geminiFailure("permanent-error"),
  });
});
