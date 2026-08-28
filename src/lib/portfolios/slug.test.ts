import assert from "node:assert/strict";
import test from "node:test";

import {
  createPortfolioSlugBase,
  createPortfolioSlugCandidate,
} from "@/lib/portfolios/slug";

test("normalizes names into safe portfolio slug bases", () => {
  assert.equal(createPortfolioSlugBase("Vishv Lange"), "vishv-lange");
  assert.equal(createPortfolioSlugBase("Vishv   Lange"), "vishv-lange");
  assert.equal(createPortfolioSlugBase("VISHV LANGE"), "vishv-lange");
  assert.equal(
    createPortfolioSlugBase("  Vishv & Lange!!! / Portfolio  "),
    "vishv-lange-portfolio",
  );
  assert.equal(createPortfolioSlugBase("Málaga Designer"), "malaga-designer");
});

test("uses the full-name fallback and never needs an email fallback", () => {
  assert.equal(
    createPortfolioSlugBase(null, "Vishv Lange"),
    "vishv-lange",
  );
  assert.equal(createPortfolioSlugBase("***", "###"), "portfolio");
});

test("creates deterministic collision suffixes within the schema limit", () => {
  const base = createPortfolioSlugBase("Vishv Lange");

  assert.equal(createPortfolioSlugCandidate(base), "vishv-lange");
  assert.equal(createPortfolioSlugCandidate(base, 2), "vishv-lange-2");
  assert.equal(createPortfolioSlugCandidate(base, 3), "vishv-lange-3");
  assert.ok(createPortfolioSlugCandidate("a".repeat(100), 200).length <= 100);
});
