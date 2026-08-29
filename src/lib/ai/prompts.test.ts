import assert from "node:assert/strict";
import test from "node:test";

import { createResumeExtractionPrompt } from "@/lib/ai/prompts";

test("Improve with AI off preserves factual extraction mode", () => {
  const prompt = createResumeExtractionPrompt(false, false, "text");

  assert.match(prompt, /Extraction mode is FACTUAL/u);
  assert.match(prompt, /do not\s+embellish/u);
  assert.match(prompt, /extracted resume text/u);
  assert.doesNotMatch(prompt, /You may strengthen or create/u);
});

test("Improve with AI on remains conservative and fact-grounded", () => {
  const prompt = createResumeExtractionPrompt(true, false, "pdf");

  assert.match(prompt, /Extraction mode is IMPROVE WITH AI/u);
  assert.match(prompt, /only from facts explicitly supported/u);
  assert.match(prompt, /Never add unsupported seniority/u);
  assert.match(prompt, /attached PDF resume/u);
});

test("the repair prompt reuses the current resume source without changing modes", () => {
  const prompt = createResumeExtractionPrompt(false, true, "text");

  assert.match(prompt, /single repair attempt/u);
  assert.match(prompt, /Re-read the resume source/u);
  assert.match(prompt, /Extraction mode is FACTUAL/u);
});
