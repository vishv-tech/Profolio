import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { supportedLayoutKeys } from "./validation";
import { allThemePack } from "@/themes/registry";

test("admin layout validation is derived from the complete unified registry", () => {
  assert.deepEqual(
    supportedLayoutKeys(),
    allThemePack.map((manifest) => manifest.layoutKey),
  );
  assert.equal(supportedLayoutKeys().length, 35);
  assert.ok(supportedLayoutKeys().includes("pavni-retro-desktop"));
});

test("admin theme mutations reauthorize and constrain registry operations", () => {
  const source = readFileSync(
    fileURLToPath(new URL("./actions.ts", import.meta.url)),
    "utf8",
  );

  assert.match(source, /export async function syncCodedThemes/);
  assert.match(source, /planCodedThemeMetadataSync/);
  assert.match(source, /await requireAdmin\(\)/);
  assert.match(source, /getThemeManifest\(selected\.layout_key\)/);
  assert.match(source, /Duplicate theme metadata must be resolved/);
});
