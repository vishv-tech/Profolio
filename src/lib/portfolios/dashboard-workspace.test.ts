import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

test("the authenticated dashboard layout provides active Overview, Analytics, and Export navigation", () => {
  const layout = source("../../app/dashboard/layout.tsx");
  const navigation = source("../../components/workspace/workspace-navigation.tsx");

  assert.match(layout, /requireActiveUser\(\)/);
  assert.match(layout, /WorkspaceNavigation/);
  assert.match(navigation, /label: "Overview"/);
  assert.match(navigation, /label: "Analytics"/);
  assert.match(navigation, /label: "Export"/);
  assert.match(navigation, /LayoutDashboard/);
  assert.match(navigation, /BarChart3/);
  assert.match(navigation, /Download/);
  assert.match(navigation, /aria-current=\{active \? "page"/);
  assert.match(navigation, /searchParams\.get\("portfolio"\)/);
});

test("Overview loads real owned workspace data and handles onboarding and unavailable selections", () => {
  const page = source("../../app/dashboard/page.tsx");

  assert.match(page, /requireActiveUser\(\)/);
  assert.match(page, /getPortfolioWorkspace\(user\.userId, requestedPortfolioId\)/);
  assert.match(page, /Create your first portfolio/);
  assert.match(page, /Portfolio unavailable/);
  assert.match(page, /PortfolioChooser/);
  assert.match(page, /portfolio\.createdAt/);
  assert.match(page, /portfolio\.updatedAt/);
  assert.match(page, /portfolio\.publishedAt/);
  assert.match(page, /portfolio\.theme\?\.name/);
  assert.match(page, /deploymentOverview\.deployment\.version/);
});

test("published Overview exposes explicit share actions and a transient success state", () => {
  const page = source("../../app/dashboard/page.tsx");
  const success = source("../../components/workspace/published-success-banner.tsx");

  assert.match(page, /DeploymentActions publicPath=\{publicPath\}/);
  assert.match(page, /PublishedSuccessBanner/);
  assert.match(page, /searchValue\(params\.published\) === "1"/);
  assert.match(success, /Portfolio published successfully\./);
  assert.match(success, /searchParams\.delete\("published"\)/);
  assert.match(success, /history\.replaceState/);
});

test("Overview integrates real editor, themes, analytics, export, and deployment routes", () => {
  const page = source("../../app/dashboard/page.tsx");

  assert.match(page, /dashboard\/editor\?\$\{portfolioQuery\}/);
  assert.match(page, /\/themes\?\$\{portfolioQuery\}/);
  assert.match(page, /dashboard\/analytics\?\$\{portfolioQuery\}/);
  assert.match(page, /dashboard\/export\?\$\{portfolioQuery\}/);
  assert.match(page, /dashboard\/deployments\?\$\{portfolioQuery\}/);
  assert.match(page, /href="\/upload"/);
});

test("Portfolio Score and optional AI plan are present without coupling score to Gemini", () => {
  const page = source("../../app/dashboard/page.tsx");
  const score = source("../../components/portfolio/portfolio-score-card.tsx");
  const plan = source("../../components/portfolio-intelligence/upgrade-plan-card.tsx");

  assert.match(page, /scorePortfolio\(portfolio\.draftContent\)/);
  assert.match(page, /PortfolioScoreCard/);
  assert.match(score, /role="progressbar"/);
  assert.match(score, /result\.categories/);
  assert.match(plan, /Generate Upgrade Plan/);
  assert.match(plan, /generateUpgradePlanAction/);
  assert.doesNotMatch(score, /Gemini|generateUpgradePlanAction/);
});

test("the real saved-draft editor requires explicit Original versus Suggested acceptance", () => {
  const page = source("../../app/dashboard/editor/page.tsx");
  const editor = source("../../components/portfolio/portfolio-draft-editor.tsx");
  const improvement = source(
    "../../components/portfolio-intelligence/content-improvement-panel.tsx",
  );

  assert.match(page, /getPortfolioWorkspace\(user\.userId, portfolioId\)/);
  assert.match(page, /PortfolioDraftEditor/);
  assert.match(editor, /ResumeReviewEditor/);
  assert.match(editor, /savePortfolioDraft/);
  assert.match(improvement, />Original</);
  assert.match(improvement, />Suggested</);
  assert.match(improvement, /Accept and save/);
  assert.match(improvement, /\bReject\b/);
  assert.match(improvement, /Suggestion rejected\. Your draft was not changed\./);
  assert.match(improvement, /Add content first/);
  assert.doesNotMatch(improvement, /dangerouslySetInnerHTML/);
});

test("post-publish routing lands on Overview rather than public or deployment detail", () => {
  const store = source("../../app/themes/ThemeStore.tsx");

  assert.match(store, /\/dashboard\?portfolio=\$\{encodeURIComponent\(portfolioId\)\}&published=1/);
  assert.doesNotMatch(store, /router\.push\(`\/p\//);
  assert.doesNotMatch(store, /dashboard\/deployments\?portfolio=/);
});
