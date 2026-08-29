import assert from "node:assert/strict";
import test from "node:test";

import {
  careerThemePack,
  createThemeRegistry,
  getCareerThemeManifest,
} from "./career-pack";
import { pavniThemePack } from "./pavni-pack";
import {
  allThemePack,
  allThemeRegistry,
  getThemeManifest,
  loadThemeComponent,
} from "./registry";

test("composes both packs without imposing a fixed registry maximum", () => {
  assert.equal(allThemePack.length, pavniThemePack.length + careerThemePack.length);
  assert.equal(allThemeRegistry.size, allThemePack.length);
  assert.equal(new Set(allThemePack.map((theme) => theme.layoutKey)).size, allThemePack.length);

  for (const manifest of [...pavniThemePack, ...careerThemePack]) {
    assert.strictEqual(getThemeManifest(manifest.layoutKey), manifest);
  }
});

test("keeps all existing career registrations intact", () => {
  for (const manifest of careerThemePack) {
    assert.strictEqual(getCareerThemeManifest(manifest.layoutKey), manifest);
    assert.strictEqual(getThemeManifest(manifest.layoutKey), manifest);
  }
});

test("unified lookups fail safely and composition still rejects duplicates", async () => {
  assert.equal(getThemeManifest("unknown-theme"), null);
  assert.equal(await loadThemeComponent("unknown-theme"), null);
  assert.throws(
    () => createThemeRegistry(pavniThemePack, careerThemePack, pavniThemePack),
    /Duplicate theme layout key/,
  );
});
