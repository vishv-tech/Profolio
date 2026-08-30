import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  careerThemePack,
  createThemeRegistry,
  getCareerThemeManifest,
} from "./career-pack";
import {
  careerThemeFixtureConfig,
  fullPortfolioFixture,
  sparsePortfolioFixture,
} from "./career-pack/dev/fixtures";
import { pavniThemePack } from "./pavni-pack";
import {
  PHOTO_FREE_THEME_LAYOUT_KEYS,
  PROFILE_IMAGE_THEME_LAYOUT_KEYS,
} from "./profile-image-support";
import {
  allThemePack,
  allThemeRegistry,
  getThemeManifest,
  loadThemeComponent,
} from "./registry";

import "./test/css-module-hook.cjs";

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

test("profile-image support audit partitions every active theme", () => {
  const activeKeys = allThemePack.map(({ layoutKey }) => layoutKey);
  const auditedKeys = [
    ...PROFILE_IMAGE_THEME_LAYOUT_KEYS,
    ...PHOTO_FREE_THEME_LAYOUT_KEYS,
  ];

  assert.equal(new Set(auditedKeys).size, auditedKeys.length);
  assert.deepEqual(new Set(auditedKeys), new Set(activeKeys));
  assert.equal(PROFILE_IMAGE_THEME_LAYOUT_KEYS.length, 31);
  assert.equal(PHOTO_FREE_THEME_LAYOUT_KEYS.length, 4);
});

test("every audited photo-compatible theme renders the same profileImageUrl", async () => {
  const before = structuredClone(fullPortfolioFixture);
  const expectedUrl = fullPortfolioFixture.personal.profileImageUrl;

  for (const layoutKey of PROFILE_IMAGE_THEME_LAYOUT_KEYS) {
    const Theme = await loadThemeComponent(layoutKey);
    assert.ok(Theme, `${layoutKey} should resolve through the unified registry`);
    const html = renderToStaticMarkup(
      createElement(Theme, {
        config: careerThemeFixtureConfig,
        data: fullPortfolioFixture,
      }),
    );

    assert.match(html, new RegExp(`<img[^>]+src="${expectedUrl}"`));
  }

  assert.deepEqual(fullPortfolioFixture, before);
});

test("photo-compatible themes keep a fallback when profileImageUrl is absent or unsafe", async () => {
  const unsafeData = {
    ...sparsePortfolioFixture,
    personal: {
      ...sparsePortfolioFixture.personal,
      profileImageUrl: "javascript:alert(1)",
    },
  };

  for (const layoutKey of PROFILE_IMAGE_THEME_LAYOUT_KEYS) {
    const Theme = await loadThemeComponent(layoutKey);
    assert.ok(Theme);

    for (const data of [sparsePortfolioFixture, unsafeData]) {
      const html = renderToStaticMarkup(
        createElement(Theme, { config: careerThemeFixtureConfig, data }),
      );

      assert.doesNotMatch(html, /<img\b/u);
      assert.match(html, /(?:>JL<|initials|typographic portrait)/u);
      assert.doesNotMatch(html, /javascript:/u);
    }
  }
});

test("photo-free themes remain photo-free without losing profile data", async () => {
  const before = structuredClone(fullPortfolioFixture);

  for (const layoutKey of PHOTO_FREE_THEME_LAYOUT_KEYS) {
    const Theme = await loadThemeComponent(layoutKey);
    assert.ok(Theme);
    const html = renderToStaticMarkup(
      createElement(Theme, {
        config: careerThemeFixtureConfig,
        data: fullPortfolioFixture,
      }),
    );

    assert.doesNotMatch(html, /<img\b/u);
  }

  assert.deepEqual(fullPortfolioFixture, before);
});

test("all shared profile-image renderers retain a broken-URL fallback", () => {
  const header = readFileSync(
    "src/themes/career-pack/shared/PortfolioHeader.tsx",
    "utf8",
  );
  const creator = readFileSync(
    "src/themes/career-pack/content-creator/CreatorPortrait.tsx",
    "utf8",
  );
  const pavni = readFileSync(
    "src/themes/pavni-pack/shared/content.tsx",
    "utf8",
  );

  for (const source of [header, creator, pavni]) {
    assert.match(source, /onError=/u);
    assert.match(source, /fallback|Fallback|initials|imageFailed/u);
  }
});
