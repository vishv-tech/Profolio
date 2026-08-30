import assert from "node:assert/strict";
import test from "node:test";

import { defaultThemeConfig } from "@/themes/default-config";
import { allThemePack } from "@/themes/registry";

import {
  buildCodedThemeRegistryEntries,
  codedThemeMetadata,
  isUniqueActiveCodedTheme,
  planCodedThemeMetadataSync,
  type ThemeMetadataRow,
} from "./metadata";

function row(
  layoutKey: string,
  overrides: Partial<ThemeMetadataRow> = {},
): ThemeMetadataRow {
  const metadata = codedThemeMetadata(layoutKey);
  assert.ok(metadata);

  return {
    id: crypto.randomUUID(),
    ...metadata,
    created_at: "2026-08-30T00:00:00.000Z",
    updated_at: "2026-08-30T00:00:00.000Z",
    is_active: true,
    ...overrides,
  };
}

test("generates deterministic valid metadata for every coded theme", () => {
  const records = allThemePack.map((manifest) =>
    codedThemeMetadata(manifest.layoutKey),
  );

  assert.equal(records.length, 35);
  assert.ok(records.every(Boolean));
  assert.deepEqual(
    records.map((record) => record?.slug),
    allThemePack.map((manifest) => manifest.layoutKey),
  );
  assert.ok(
    records.every(
      (record) =>
        JSON.stringify(record?.default_config) ===
        JSON.stringify(defaultThemeConfig),
    ),
  );
});

test("sync creates missing rows and is idempotent after canonical rows exist", () => {
  const firstPlan = planCodedThemeMetadataSync([]);
  assert.equal(firstPlan.operations.length, allThemePack.length);
  assert.ok(firstPlan.operations.every((operation) => operation.kind === "insert"));

  const synchronizedRows = allThemePack.map((manifest) => row(manifest.layoutKey));
  const secondPlan = planCodedThemeMetadataSync(synchronizedRows);

  assert.equal(secondPlan.operations.length, 0);
  assert.equal(secondPlan.issues.length, 0);
  assert.equal(secondPlan.unchanged.length, allThemePack.length);
});

test("updates an existing career-ai-data row without replacing its id or activity", () => {
  const existing = row("career-ai-data", {
    id: "792d0fb3-fb69-4af5-bf1b-8efc2aacfcb1",
    name: "Placeholder AI theme",
    slug: "legacy-ai-data",
    description: null,
    default_config: {},
    is_active: false,
  });
  const plan = planCodedThemeMetadataSync([existing]);
  const operation = plan.operations.find(
    (item) => item.layoutKey === "career-ai-data",
  );

  assert.ok(operation && operation.kind === "update");
  assert.equal(operation.id, existing.id);
  assert.equal(operation.record.slug, "career-ai-data");
  assert.ok(!("is_active" in operation.record));
  assert.equal(
    plan.operations.filter((item) => item.kind === "insert").length,
    allThemePack.length - 1,
  );
});

test("detects duplicates and slug conflicts without scheduling unsafe writes", () => {
  const duplicateA = row("career-ai-data");
  const duplicateB = row("career-ai-data");
  const slugOwner = row("career-mechanical-engineer", {
    layout_key: "legacy-installed-theme",
    slug: "career-electrical-engineer",
  });
  const plan = planCodedThemeMetadataSync([
    duplicateA,
    duplicateB,
    slugOwner,
  ]);

  assert.ok(
    plan.issues.some(
      (issue) =>
        issue.layoutKey === "career-ai-data" &&
        issue.kind === "duplicate-layout",
    ),
  );
  assert.ok(
    plan.issues.some(
      (issue) =>
        issue.layoutKey === "career-electrical-engineer" &&
        issue.kind === "slug-conflict",
    ),
  );
  assert.ok(
    !plan.operations.some(
      (operation) =>
        operation.layoutKey === "career-ai-data" ||
        operation.layoutKey === "career-electrical-engineer",
    ),
  );
});

test("registry states distinguish missing, duplicate, invalid, inactive, and persistable", () => {
  const valid = row("career-mechanical-engineer");
  const inactive = row("career-electrical-engineer", { is_active: false });
  const invalid = row("career-ai-data", { default_config: {} });
  const duplicateA = row("career-finance-ca");
  const duplicateB = row("career-finance-ca");
  const entries = buildCodedThemeRegistryEntries([
    valid,
    inactive,
    invalid,
    duplicateA,
    duplicateB,
  ]);

  assert.equal(
    entries.find((entry) => entry.layoutKey === valid.layout_key)?.canPersist,
    true,
  );
  assert.equal(
    entries.find((entry) => entry.layoutKey === inactive.layout_key)?.metadataState,
    "ready",
  );
  assert.equal(
    entries.find((entry) => entry.layoutKey === inactive.layout_key)?.canPersist,
    false,
  );
  assert.equal(
    entries.find((entry) => entry.layoutKey === invalid.layout_key)?.metadataState,
    "invalid",
  );
  assert.equal(
    entries.find((entry) => entry.layoutKey === duplicateA.layout_key)?.metadataState,
    "duplicate",
  );
  assert.equal(
    entries.find((entry) => entry.layoutKey === "career-legal-professional")
      ?.metadataState,
    "missing",
  );
});

test("only a unique active coded row with valid ThemeConfig is persistable", () => {
  const valid = row("career-ai-data");

  assert.equal(isUniqueActiveCodedTheme([valid], valid.layout_key), true);
  assert.equal(
    isUniqueActiveCodedTheme([{ ...valid, is_active: false }], valid.layout_key),
    false,
  );
  assert.equal(
    isUniqueActiveCodedTheme([valid, { ...valid, id: crypto.randomUUID() }], valid.layout_key),
    false,
  );
  assert.equal(isUniqueActiveCodedTheme([valid], "unknown-theme"), false);
});
