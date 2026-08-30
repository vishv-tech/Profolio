import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildWorkspacePortfolio,
  parseWorkspaceChoices,
  resolveWorkspaceSelection,
} from "./workspace-model";
import type { PortfolioData } from "@/types/portfolio";

const FIRST_ID = "11111111-1111-4111-8111-111111111111";
const SECOND_ID = "22222222-2222-4222-8222-222222222222";
const THEME_ID = "33333333-3333-4333-8333-333333333333";

const emptyData: PortfolioData = {
  personal: { fullName: "Asha", headline: "", email: "", phone: "", location: "", profileImageUrl: "" },
  summary: "",
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
};

const choices = parseWorkspaceChoices([
  {
    id: FIRST_ID,
    title: "First portfolio",
    slug: "first-portfolio",
    status: "draft",
    updated_at: "2026-08-30T10:00:00.000Z",
  },
  {
    id: SECOND_ID,
    title: "Published portfolio",
    slug: "published-portfolio",
    status: "published",
    updated_at: "2026-08-29T10:00:00.000Z",
  },
]);

test("workspace selection handles no portfolio and defaults to the latest owned portfolio", () => {
  assert.deepEqual(resolveWorkspaceSelection([], null), { status: "empty" });
  assert.deepEqual(resolveWorkspaceSelection(choices, null), {
    status: "selected",
    id: FIRST_ID,
  });
});

test("multiple portfolios can be selected by a validated owned id", () => {
  assert.equal(choices.length, 2);
  assert.deepEqual(resolveWorkspaceSelection(choices, SECOND_ID), {
    status: "selected",
    id: SECOND_ID,
  });
});

test("invalid and other-user portfolio ids are unavailable", () => {
  assert.deepEqual(resolveWorkspaceSelection(choices, "not-a-uuid"), {
    status: "unavailable",
  });
  assert.deepEqual(resolveWorkspaceSelection(choices, crypto.randomUUID()), {
    status: "unavailable",
  });
});

test("draft and published workspace models retain real timestamps, slug, theme, and data", () => {
  const portfolio = buildWorkspacePortfolio(
    {
      id: SECOND_ID,
      title: "Published portfolio",
      slug: "published-portfolio",
      status: "published",
      updated_at: "2026-08-30T10:00:00.000Z",
      created_at: "2026-08-20T10:00:00.000Z",
      published_at: "2026-08-30T09:00:00.000Z",
      draft_content: emptyData,
      theme_id: THEME_ID,
    },
    {
      id: THEME_ID,
      name: "Database name",
      layout_key: "pavni-retro-desktop",
    },
  );

  assert.ok(portfolio);
  assert.equal(portfolio.status, "published");
  assert.equal(portfolio.slug, "published-portfolio");
  assert.equal(portfolio.createdAt, "2026-08-20T10:00:00.000Z");
  assert.equal(portfolio.updatedAt, "2026-08-30T10:00:00.000Z");
  assert.equal(portfolio.publishedAt, "2026-08-30T09:00:00.000Z");
  assert.equal(portfolio.theme?.name, "Retro Desktop");
  assert.deepEqual(portfolio.draftContent, emptyData);
});

test("missing optional theme metadata does not break an owned draft", () => {
  const portfolio = buildWorkspacePortfolio(
    {
      id: FIRST_ID,
      title: "First portfolio",
      slug: "first-portfolio",
      status: "draft",
      updated_at: "2026-08-30T10:00:00.000Z",
      created_at: "2026-08-20T10:00:00.000Z",
      published_at: null,
      draft_content: emptyData,
      theme_id: null,
    },
    null,
  );

  assert.ok(portfolio);
  assert.equal(portfolio.theme, null);
  assert.equal(portfolio.publishedAt, null);
});

test("workspace data queries remain active-user-owned and reuse deployment overview", () => {
  const query = readFileSync(
    fileURLToPath(new URL("./workspace.ts", import.meta.url)),
    "utf8",
  );

  assert.match(query, /\.eq\("user_id", userId\)/);
  assert.match(query, /getOwnedPortfolioDeploymentOverview\(selection\.id, userId\)/);
  assert.ok(
    query.indexOf('.eq("user_id", userId)') < query.indexOf("createAdminClient()"),
  );
});
