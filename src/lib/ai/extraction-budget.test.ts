import assert from "node:assert/strict";
import test from "node:test";

import {
  canStartSchemaRepair,
  GEMINI_SCHEMA_REPAIR_MIN_BUDGET_MS,
  remainingGeminiBudgetMs,
} from "@/lib/ai/extraction-budget";

test("schema repair starts only when meaningful overall budget remains", () => {
  const now = 10_000;

  assert.equal(
    canStartSchemaRepair(
      now + GEMINI_SCHEMA_REPAIR_MIN_BUDGET_MS,
      now,
    ),
    true,
  );
  assert.equal(
    canStartSchemaRepair(
      now + GEMINI_SCHEMA_REPAIR_MIN_BUDGET_MS - 1,
      now,
    ),
    false,
  );
  assert.equal(remainingGeminiBudgetMs(now - 1, now), 0);
});
