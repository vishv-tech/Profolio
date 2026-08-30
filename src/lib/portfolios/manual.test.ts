import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createEmptyCustomSection,
  createEmptyCustomSectionItem,
  createEmptyEducation,
  createEmptyExperience,
  createEmptyPortfolioData,
  createEmptyProject,
} from "@/lib/portfolios/defaults";
import { scorePortfolio } from "@/lib/portfolio-score/score";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";

test("manual creation starts with the canonical valid empty PortfolioData", () => {
  const portfolio = createEmptyPortfolioData();
  const parsed = PortfolioDataSchema.safeParse(portfolio);

  assert.equal(parsed.success, true);
  assert.equal(portfolio.personal.profileImageUrl, "");
  assert.equal(portfolio.summary, "");
  assert.deepEqual(portfolio.experience, []);
  assert.deepEqual(portfolio.education, []);
  assert.deepEqual(portfolio.projects, []);
  assert.deepEqual(portfolio.skills, []);
  assert.deepEqual(portfolio.customSections, []);
});

test("manual repeatable entries receive stable non-index IDs", () => {
  const ids = ["experience-id", "education-id", "project-id", "section-id", "item-id"];
  const createId = () => ids.shift() ?? "unexpected-id";
  const experience = createEmptyExperience(createId);
  const education = createEmptyEducation(createId);
  const project = createEmptyProject(createId);
  const section = createEmptyCustomSection(createId);
  const item = createEmptyCustomSectionItem(createId);

  assert.equal(experience.id, "experience-id");
  assert.equal(education.id, "education-id");
  assert.equal(project.id, "project-id");
  assert.equal(section.id, "section-id");
  assert.equal(item.id, "item-id");
  assert.equal(experience.id, experience.id);
});

test("an empty manual portfolio uses the existing deterministic score safely", () => {
  const result = scorePortfolio(createEmptyPortfolioData());

  assert.equal(result.score >= 0, true);
  assert.equal(result.score < 50, true);
});

test("manual creation authenticates, stays owner-scoped, and skips resume AI", () => {
  const actionSource = readFileSync(
    "src/lib/portfolios/manual-actions.ts",
    "utf8",
  );
  const mutationSource = readFileSync(
    "src/lib/portfolios/mutations.ts",
    "utf8",
  );
  const buttonSource = readFileSync(
    "src/components/portfolio/manual-portfolio-button.tsx",
    "utf8",
  );

  assert.match(actionSource, /requireActiveUser\(\)/u);
  assert.match(actionSource, /source: "manual"/u);
  assert.doesNotMatch(actionSource, /Gemini|extractPortfolioFromPdf|processResume|uploadResume/u);
  assert.match(mutationSource, /user_id: userId/u);
  assert.match(mutationSource, /findExistingPortfolio/u);
  assert.match(buttonSource, /disabled=\{pending\}/u);
});

test("manual draft creation and editing preserve publication snapshots", () => {
  const actionSource = readFileSync(
    "src/lib/portfolios/manual-actions.ts",
    "utf8",
  );
  const draftSource = readFileSync(
    "src/lib/portfolios/draft-actions.ts",
    "utf8",
  );

  assert.doesNotMatch(actionSource, /published_content/u);
  assert.match(draftSource, /update\(\{ draft_content:/u);
  assert.doesNotMatch(draftSource, /published_content\s*:/u);
  assert.match(actionSource, /revalidatePath\("\/themes"\)/u);
});
