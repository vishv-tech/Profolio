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
  const resume = source("../ai/resume-extraction.ts");
  const shared = source("../ai/gemini.ts");

  assert.match(adapter, /import "server-only"/);
  assert.match(adapter, /requestWithGeminiAvailabilityFallback/);
  assert.match(adapter, /AbortController/);
  assert.match(
    adapter,
    /PORTFOLIO_INTELLIGENCE_MODEL_ATTEMPT_TIMEOUT_MS\s*=\s*30_000/,
  );
  assert.match(adapter, /UPGRADE_PLAN_TIMEOUT_MS\s*=\s*45_000/);
  assert.match(adapter, /CONTENT_IMPROVEMENT_TIMEOUT_MS\s*=\s*105_000/);
  assert.match(
    adapter,
    /PORTFOLIO_INTELLIGENCE_RECOVERY_BACKOFF_MS\s*=\s*350/,
  );
  assert.match(
    adapter,
    /PORTFOLIO_INTELLIGENCE_RECOVERY_SAFETY_MARGIN_MS\s*=\s*1_000/,
  );
  assert.match(
    adapter,
    /timeout:\s*PORTFOLIO_INTELLIGENCE_MODEL_ATTEMPT_TIMEOUT_MS/,
  );
  assert.match(
    adapter,
    /attemptTimeoutMs:\s*PORTFOLIO_INTELLIGENCE_MODEL_ATTEMPT_TIMEOUT_MS/,
  );
  assert.match(adapter, /responseMimeType: "application\/json"/);
  assert.doesNotMatch(adapter, /NEXT_PUBLIC_GEMINI|GEMINI_API_KEY/);
  assert.match(shared, /GEMINI_MODEL_ATTEMPT_TIMEOUT_MS\s*=\s*30_000/);
  assert.match(
    shared,
    /options\.attemptTimeoutMs\s*\?\?\s*GEMINI_MODEL_ATTEMPT_TIMEOUT_MS/,
  );
  assert.match(resume, /timeout:\s*GEMINI_MODEL_ATTEMPT_TIMEOUT_MS/);
  assert.doesNotMatch(resume, /attemptTimeoutMs:/);
  assert.doesNotMatch(resume, /recovery:/);
  assert.match(adapter, /recovery:\s*\{/);
  assert.match(adapter, /model:\s*GEMINI_RESUME_MODELS\[0\]/);
  assert.match(adapter, /"recovery-evaluation"/);
  assert.match(adapter, /getGeminiFailureDiagnostics\(error\)/);
  assert.match(adapter, /remainingMs:\s*remainingBudgetMs\(\)/);
  assert.match(
    adapter,
    /generateStructuredUpgradePlan\s*=\s*\r?\n?\s*createPortfolioIntelligenceGenerator\(UPGRADE_PLAN_TIMEOUT_MS\)/,
  );
  assert.match(
    adapter,
    /controller\.abort\(new Error\("Portfolio intelligence timed out\."\)\)/,
  );
  assert.match(shared, /GEMINI_RESUME_MODELS\s*=\s*\[[\s\S]*"gemini-3\.5-flash"[\s\S]*"gemini-3\.6-flash"[\s\S]*"gemini-3\.7-flash"/);
  assert.match(shared, /GEMINI_OVERALL_TIMEOUT_MS\s*=\s*120_000/);
});

test("Upgrade Plan returns a source-labeled deterministic fallback after AI exhaustion", () => {
  const actions = source("./actions.ts");
  const card = source("../../components/portfolio-intelligence/upgrade-plan-card.tsx");

  assert.match(actions, /generateReliablePortfolioUpgradePlan/);
  assert.match(actions, /generateStructuredUpgradePlan/);
  assert.match(actions, /source: result\.source/);
  assert.match(card, /result\.source/);
  assert.match(card, /AI is temporarily unavailable, so this plan was generated from your portfolio analysis\./);
  assert.match(card, /disabled=\{isPending\}/);
  assert.match(card, /isPending \? "Generating\.\.\."/);
});
