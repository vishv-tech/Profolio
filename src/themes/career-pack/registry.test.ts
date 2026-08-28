import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  careerThemePack,
  careerThemeRegistry,
  createThemeRegistry,
  getCareerThemeManifest,
  loadCareerThemeComponent,
} from "./registry";
import {
  careerThemeFixtureConfig,
  fullPortfolioFixture,
  sparsePortfolioFixture,
} from "./dev/fixtures";
import type { CareerThemeLayoutKey } from "./types";

const EXPECTED_LAYOUT_KEYS = [
  "career-content-creator",
  "career-mechanical-engineer",
  "career-electrical-engineer",
  "career-finance-ca",
  "career-legal-professional",
  "career-architect-designer",
  "career-healthcare-professional",
  "career-ai-data",
  "career-product-designer",
  "career-business-consulting",
] as const satisfies readonly CareerThemeLayoutKey[];

test("registers ten unique career theme layout keys", () => {
  const registeredKeys = careerThemePack.map((theme) => theme.layoutKey);

  assert.deepEqual(registeredKeys, EXPECTED_LAYOUT_KEYS);
  assert.equal(new Set(registeredKeys).size, EXPECTED_LAYOUT_KEYS.length);
  assert.equal(careerThemeRegistry.size, EXPECTED_LAYOUT_KEYS.length);
});

test("registers every career manifest for lookup", () => {
  for (const manifest of careerThemePack) {
    assert.strictEqual(getCareerThemeManifest(manifest.layoutKey), manifest);
  }
});

test("rejects duplicate layout keys while composing packs", () => {
  assert.throws(
    () => createThemeRegistry(careerThemePack, careerThemePack),
    /Duplicate theme layout key/,
  );
});

test("renders every career theme with the full PortfolioData fixture", async () => {
  for (const manifest of careerThemePack) {
    const Theme = (await manifest.component()).default;
    const html = renderToStaticMarkup(
      createElement(Theme, {
        config: careerThemeFixtureConfig,
        data: fullPortfolioFixture,
      }),
    );

    assert.match(html, new RegExp(`data-theme-layout="${manifest.layoutKey}"`));
    assert.match(html, /Avery Morgan/);
  }
});

test("renders every career theme with sparse PortfolioData", async () => {
  for (const manifest of careerThemePack) {
    const Theme = await loadCareerThemeComponent(manifest.layoutKey);
    assert.ok(Theme);

    const html = renderToStaticMarkup(
      createElement(Theme, {
        config: careerThemeFixtureConfig,
        data: sparsePortfolioFixture,
      }),
    );

    assert.match(html, /Jordan Lee/);
    assert.doesNotMatch(html, />Experience</);
  }
});

test("unknown career layout keys fail safely", async () => {
  assert.equal(getCareerThemeManifest("career-unknown"), null);
  assert.equal(await loadCareerThemeComponent("career-unknown"), null);
});
