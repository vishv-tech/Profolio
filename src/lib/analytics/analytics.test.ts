import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  aggregateViewEvents,
  buildPortfolioViewEvent,
  claimSessionView,
  normalizeReferrer,
  PortfolioViewRequestSchema,
} from "@/lib/analytics/core";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

test("published public view flow validates the slug before its server-only insert", () => {
  const record = source("./record.ts");
  const route = source("../../app/api/analytics/view/route.ts");

  assert.match(record, /PortfolioViewRequestSchema\.safeParse/);
  assert.match(record, /getPublishedPortfolioBySlug\(request\.data\.slug\)/);
  assert.match(record, /if \(!event\) return "unavailable"/);
  assert.match(record, /\.from\("portfolio_events"\)[\s\S]*\.insert\(event\)/);
  assert.match(route, /recordPublishedPortfolioView\(input\)/);
});

test("invalid and unpublished portfolio contexts cannot produce an event", () => {
  assert.equal(buildPortfolioViewEvent("not-a-uuid", null), null);
  assert.equal(PortfolioViewRequestSchema.safeParse({ slug: "Bad Slug" }).success, false);

  const record = source("./record.ts");
  assert.match(record, /const event = portfolio[\s\S]*\?[\s\S]*: null/);
  assert.match(record, /return "unavailable"/);
});

test("view request validation rejects extra private fields", () => {
  const result = PortfolioViewRequestSchema.safeParse({
    slug: "real-portfolio",
    email: "visitor@example.com",
    token: "secret",
  });
  assert.equal(result.success, false);
});

test("referrers are reduced to privacy-safe categories", () => {
  assert.equal(normalizeReferrer(null), "Direct");
  assert.equal(normalizeReferrer("https://www.google.co.in/search?q=private"), "Google");
  assert.equal(normalizeReferrer("https://linkedin.com/feed"), "LinkedIn");
  assert.equal(normalizeReferrer("https://github.com/openai"), "GitHub");
  assert.equal(normalizeReferrer("https://example.com/private?token=x"), "Other");
});

test("stored view events contain no visitor secrets or portfolio content", () => {
  const event = buildPortfolioViewEvent(
    "11111111-1111-4111-8111-111111111111",
    "https://example.com/path?email=person@example.com",
  );

  assert.deepEqual(event, {
    portfolio_id: "11111111-1111-4111-8111-111111111111",
    event_type: "view",
    referrer: "Other",
  });
  assert.doesNotMatch(JSON.stringify(event), /email|phone|resume|token|visitor_identifier/i);
});

test("session tracking claims only the first rapid view", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
  const memory = new Set<string>();

  assert.equal(claimSessionView("real-portfolio", storage, memory), true);
  assert.equal(claimSessionView("real-portfolio", storage, memory), false);
});

test("aggregation calculates total, today, 7-day, and 30-day views", () => {
  const summary = aggregateViewEvents(
    [
      { createdAt: "2026-08-30T09:00:00.000Z" },
      { createdAt: "2026-08-24T12:00:00.000Z" },
      { createdAt: "2026-08-01T12:00:00.000Z" },
      { createdAt: "2026-07-01T12:00:00.000Z" },
      { createdAt: "invalid" },
    ],
    new Date("2026-08-30T12:00:00.000Z"),
  );

  assert.equal(summary.total, 4);
  assert.equal(summary.today, 1);
  assert.equal(summary.last7Days, 2);
  assert.equal(summary.last30Days, 3);
});

test("daily grouping uses UTC dates and fills zero-view days", () => {
  const summary = aggregateViewEvents(
    [
      { createdAt: "2026-08-29T23:59:00.000Z" },
      { createdAt: "2026-08-30T00:01:00.000Z" },
      { createdAt: "2026-08-30T11:00:00.000Z" },
    ],
    new Date("2026-08-30T12:00:00.000Z"),
    7,
  );

  assert.equal(summary.daily.length, 7);
  assert.deepEqual(summary.daily.slice(-2), [
    { date: "2026-08-29", views: 1 },
    { date: "2026-08-30", views: 2 },
  ]);
  assert.equal(summary.daily[0]?.views, 0);
});

test("a zero-event portfolio returns stable zero metrics and trend", () => {
  const summary = aggregateViewEvents([], new Date("2026-08-30T12:00:00.000Z"), 7);

  assert.deepEqual(
    [summary.total, summary.today, summary.last7Days, summary.last30Days],
    [0, 0, 0, 0],
  );
  assert.equal(summary.daily.every(({ views }) => views === 0), true);
});

test("owner analytics remain authenticated, explicitly scoped, and RLS backed", () => {
  const page = source("../../app/dashboard/analytics/page.tsx");
  const queries = source("./queries.ts");
  const migration = source(
    "../../../supabase/migrations/20260827000000_initial_profolio_schema.sql",
  );

  assert.match(page, /requireActiveUser\(\)/);
  assert.match(queries, /\.eq\("user_id", userId\)/);
  assert.match(queries, /\.eq\("portfolio_id", portfolio\.id\)/);
  assert.match(migration, /Portfolio owners can read analytics events/);
  assert.match(migration, /portfolios\.user_id = \(select auth\.uid\(\)\)/);
});
