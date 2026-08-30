import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createEmptyAchievement,
  createEmptyCertification,
  createEmptyCustomSection,
  createEmptyCustomSectionItem,
  createEmptyEducation,
  createEmptyExperience,
  createEmptyLanguage,
  createEmptyLink,
  createEmptyPortfolioData,
  createEmptyProject,
  createEmptySkillGroup,
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
  const ids = [
    "experience-id",
    "education-id",
    "project-id",
    "skill-id",
    "achievement-id",
    "certification-id",
    "link-id",
    "language-id",
    "section-id",
    "item-id",
  ];
  const createId = () => ids.shift() ?? "unexpected-id";
  const experience = createEmptyExperience(createId);
  const education = createEmptyEducation(createId);
  const project = createEmptyProject(createId);
  const skill = createEmptySkillGroup(createId);
  const achievement = createEmptyAchievement(createId);
  const certification = createEmptyCertification(createId);
  const link = createEmptyLink(createId);
  const language = createEmptyLanguage(createId);
  const section = createEmptyCustomSection(createId);
  const item = createEmptyCustomSectionItem(createId);

  assert.equal(experience.id, "experience-id");
  assert.equal(education.id, "education-id");
  assert.equal(project.id, "project-id");
  assert.equal(skill.id, "skill-id");
  assert.equal(achievement.id, "achievement-id");
  assert.equal(certification.id, "certification-id");
  assert.equal(link.id, "link-id");
  assert.equal(language.id, "language-id");
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
  assert.doesNotMatch(
    actionSource,
    /Gemini|extractPortfolioFromPdf|processResume|uploadResume|from\("resumes"\)/u,
  );
  assert.match(mutationSource, /user_id: userId/u);
  assert.match(mutationSource, /findExistingPortfolio/u);
  assert.match(mutationSource, /createPortfolioSlugCandidate/u);
  assert.match(mutationSource, /result\.error\?\.code !== "23505"/u);
  assert.match(buttonSource, /disabled=\{pending\}/u);
  assert.match(buttonSource, /\/dashboard\/editor\?portfolio=/u);
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

test("the shared editor exposes every repeatable section with add, remove, and reorder controls", () => {
  const editor = readFileSync(
    "src/components/resume/resume-review-editor.tsx",
    "utf8",
  );

  for (const factory of [
    "createEmptyExperience",
    "createEmptyEducation",
    "createEmptyProject",
    "createEmptySkillGroup",
    "createEmptyAchievement",
    "createEmptyCertification",
    "createEmptyLink",
    "createEmptyLanguage",
    "createEmptyCustomSection",
    "createEmptyCustomSectionItem",
  ]) {
    assert.match(editor, new RegExp(`${factory}\\(\\)`));
  }

  assert.match(editor, /moveItem\(items, index, direction\)/u);
  assert.match(editor, /removeItem\(items, index\)/u);
  assert.match(editor, /value\.interests/u);
  assert.match(editor, /value\.summary/u);
  assert.match(editor, /ProfilePhotoEditor/u);
});

test("manual portfolios retain the existing score, AI, theme, analytics, and export workspaces", () => {
  const dashboard = readFileSync("src/app/dashboard/page.tsx", "utf8");
  const draftEditor = readFileSync(
    "src/components/portfolio/portfolio-draft-editor.tsx",
    "utf8",
  );

  assert.match(dashboard, /PortfolioScoreCard/u);
  assert.match(dashboard, /UpgradePlanCard/u);
  assert.match(dashboard, /\/themes\?\$\{portfolioQuery\}/u);
  assert.match(dashboard, /\/dashboard\/analytics\?\$\{portfolioQuery\}/u);
  assert.match(dashboard, /\/dashboard\/export\?\$\{portfolioQuery\}/u);
  assert.match(draftEditor, /ContentImprovementPanel/u);
  assert.match(draftEditor, /savePortfolioDraft/u);
});
