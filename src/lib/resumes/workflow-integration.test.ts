import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(path, "utf8");
}

test("resume processing selects once before optional media and one completion write", () => {
  const actions = source("src/app/upload/actions.ts");
  const selectionIndex = actions.indexOf("extractResumeWithFallback(");
  const mediaIndex = actions.lastIndexOf("addBestEffortProfileMedia({");
  const completionIndex = actions.indexOf('"database-write"', mediaIndex);
  const completionWrites = actions.match(/status:\s*"completed"/gu) ?? [];

  assert.ok(selectionIndex >= 0);
  assert.ok(mediaIndex > selectionIndex);
  assert.ok(completionIndex > mediaIndex);
  assert.equal(completionWrites.length, 1);
  assert.doesNotMatch(actions, /completed_deterministic|completed_ai|fallback_success/u);
});

test("Review shows the fallback notice only for deterministic results", () => {
  const workflow = source("src/components/upload/resume-workflow.tsx");
  const fallbackCondition =
    /resume\.extractionSource === "deterministic"[\s\S]*?AI extraction was temporarily unavailable[\s\S]*?basic resume extraction/um;

  assert.match(workflow, fallbackCondition);
  assert.doesNotMatch(
    workflow,
    /resume\.extractionSource === "gemini"[\s\S]*?temporarily unavailable/um,
  );
});

test("existing Review save and manual portfolio paths remain connected", () => {
  const actions = source("src/app/upload/actions.ts");
  const workflow = source("src/components/upload/resume-workflow.tsx");
  const manual = source("src/lib/portfolios/manual-actions.ts");

  assert.match(actions, /export async function saveResumeReview/u);
  assert.match(workflow, /saveResumeReview\(resume\.id, portfolio\)/u);
  assert.match(manual, /createEmptyPortfolioData/u);
  assert.doesNotMatch(manual, /extractResumeWithFallback|runSafeGeminiExtraction/u);
});
