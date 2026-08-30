import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildDeploymentOverview } from "./deployment-overview-model";

const PORTFOLIO_ID = "11111111-1111-4111-8111-111111111111";
const DEPLOYMENT_ID = "22222222-2222-4222-8222-222222222222";
const THEME_ID = "33333333-3333-4333-8333-333333333333";

const publishedPortfolio = {
  id: PORTFOLIO_ID,
  title: "Vishv Portfolio",
  slug: "vishv-portfolio",
  status: "published",
  published_at: "2026-08-30T05:05:00.000Z",
};

const currentDeployment = {
  id: DEPLOYMENT_ID,
  portfolio_id: PORTFOLIO_ID,
  version: 3,
  status: "current",
  theme_id: THEME_ID,
  created_at: "2026-08-30T05:05:00.000Z",
};

const selectedTheme = {
  id: THEME_ID,
  name: "Retro Desktop",
  layout_key: "pavni-retro-desktop",
};

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
}

test("builds the current deployment overview from persisted portfolio data", () => {
  const result = buildDeploymentOverview({
    deployment: currentDeployment,
    portfolio: publishedPortfolio,
    theme: selectedTheme,
  });

  assert.equal(result.status, "ready");
  if (result.status !== "ready") return;

  assert.equal(result.overview.portfolio.id, PORTFOLIO_ID);
  assert.equal(result.overview.portfolio.title, "Vishv Portfolio");
  assert.equal(result.overview.portfolio.publicPath, "/p/vishv-portfolio");
  assert.equal(result.overview.portfolio.publishedAt, publishedPortfolio.published_at);
  assert.equal(result.overview.deployment.version, 3);
  assert.equal(result.overview.deployment.createdAt, currentDeployment.created_at);
  assert.equal(result.overview.theme.name, "Retro Desktop");
  assert.equal(result.overview.theme.layoutKey, "pavni-retro-desktop");
});

test("rejects mismatched deployments and unregistered theme metadata", () => {
  assert.deepEqual(
    buildDeploymentOverview({
      deployment: { ...currentDeployment, portfolio_id: crypto.randomUUID() },
      portfolio: publishedPortfolio,
      theme: selectedTheme,
    }),
    { status: "unavailable" },
  );

  assert.deepEqual(
    buildDeploymentOverview({
      deployment: currentDeployment,
      portfolio: publishedPortfolio,
      theme: { ...selectedTheme, layout_key: "arbitrary-theme" },
    }),
    { status: "unavailable" },
  );
});

test("handles an unpublished owned portfolio without exposing a public link", () => {
  const result = buildDeploymentOverview({
    deployment: null,
    portfolio: {
      ...publishedPortfolio,
      status: "draft",
      published_at: null,
    },
    theme: null,
  });

  assert.deepEqual(result, {
    status: "unpublished",
    portfolio: {
      id: PORTFOLIO_ID,
      title: "Vishv Portfolio",
      slug: "vishv-portfolio",
      status: "draft",
    },
  });
  assert.doesNotMatch(JSON.stringify(result), /publicPath|\/p\//);
});

test("post-publish navigation stays in the authenticated workspace", () => {
  const themeStore = source("../../app/themes/ThemeStore.tsx");

  assert.match(
    themeStore,
    /router\.push\([\s\S]*dashboard\/deployments\?portfolio=/,
  );
  assert.match(themeStore, /&published=1/);
  assert.doesNotMatch(themeStore, /router\.push\(`\/p\//);
});

test("deployment overview keeps ownership and current-version checks server-side", () => {
  const query = source("./deployment-overview.ts");
  const page = source("../../app/dashboard/deployments/page.tsx");

  assert.match(query, /PortfolioIdSchema\.safeParse/);
  assert.match(query, /\.eq\("id", parsedId\.data\)/);
  assert.match(query, /\.eq\("user_id", userId\)/);
  assert.match(query, /\.eq\("portfolio_id", parsedId\.data\)/);
  assert.match(query, /\.eq\("status", "current"\)/);
  assert.ok(
    query.indexOf('.eq("user_id", userId)') <
      query.indexOf("createAdminClient()"),
    "privileged theme metadata must be read only after ownership is established",
  );
  assert.match(page, /requireActiveUser\(\)/);
  assert.match(page, /portfolioId,[\s\S]*user\.userId/);
  assert.match(page, /notFound\(\)/);
});

test("overview displays real deployment details and explicit public actions", () => {
  const page = source("../../app/dashboard/deployments/page.tsx");
  const actions = source("../../components/portfolio/deployment-actions.tsx");

  assert.match(page, /overview\.portfolio\.publicPath/);
  assert.match(page, /overview\.deployment\.version/);
  assert.match(page, /overview\.portfolio\.publishedAt/);
  assert.match(page, /overview\.deployment\.createdAt/);
  assert.match(page, /overview\.theme\.name/);
  assert.match(page, /Portfolio published successfully/);
  assert.match(actions, /window\.location\.origin/);
  assert.match(actions, /navigator\.clipboard\.writeText/);
  assert.match(actions, /target="_blank"/);
  assert.match(actions, /rel="noopener noreferrer"/);
  assert.match(actions, /Open Portfolio/);
});
