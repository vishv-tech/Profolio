import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

test("all AI portfolio actions authenticate and scope draft reads to ownership", () => {
  const actions = source("./actions.ts");

  assert.match(actions, /generateUpgradePlanAction[\s\S]*requireActiveUser\(\)/);
  assert.match(actions, /generateContentImprovementAction[\s\S]*requireActiveUser\(\)/);
  assert.match(actions, /applyContentImprovementAction[\s\S]*requireActiveUser\(\)/);
  assert.match(actions, /\.eq\("id", portfolioId\)[\s\S]*\.eq\("user_id", userId\)/);
  assert.match(actions, /PortfolioIdSchema\.safeParse/);
  assert.match(actions, /PortfolioDataSchema\.safeParse/);
});

test("suggestion generation has no database mutation path", () => {
  const actions = source("./actions.ts");
  const generationOnly = actions.slice(
    actions.indexOf("export async function generateContentImprovementAction"),
    actions.indexOf("export type ApplyImprovementActionResult"),
  );

  assert.doesNotMatch(generationOnly, /\.update\(|draft_content:/);
  assert.match(generationOnly, /current !== target\.data\.original/);
});

test("acceptance uses ownership, stale-write protection, and draft-only mutation", () => {
  const actions = source("./actions.ts");
  const applyOnly = actions.slice(
    actions.indexOf("export async function applyContentImprovementAction"),
  );

  assert.match(applyOnly, /\.update\(\{ draft_content:/);
  assert.match(applyOnly, /\.eq\("user_id", user\.userId\)/);
  assert.match(applyOnly, /\.eq\("updated_at", draft\.updatedAt\)/);
  assert.doesNotMatch(applyOnly, /published_content\s*:/);
  assert.doesNotMatch(applyOnly, /dangerouslySetInnerHTML/);
});

test("manual draft saves are active-user, owner, and concurrency protected", () => {
  const action = source("../portfolios/draft-actions.ts");

  assert.match(action, /requireActiveUser\(\)/);
  assert.match(action, /PortfolioDataSchema\.safeParse/);
  assert.match(action, /\.update\(\{ draft_content:/);
  assert.match(action, /\.eq\("id", parsedId\.data\)/);
  assert.match(action, /\.eq\("user_id", user\.userId\)/);
  assert.match(action, /\.eq\("updated_at", updatedAt\.data\)/);
  assert.doesNotMatch(action, /published_content\s*:/);
});

test("Gemini stays server-only and uses the bounded existing availability helper", () => {
  const adapter = source("./gemini.ts");

  assert.match(adapter, /import "server-only"/);
  assert.match(adapter, /requestWithGeminiAvailabilityFallback/);
  assert.match(adapter, /AbortController/);
  assert.match(adapter, /responseMimeType: "application\/json"/);
  assert.doesNotMatch(adapter, /NEXT_PUBLIC_GEMINI|GEMINI_API_KEY/);
});
