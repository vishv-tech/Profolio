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
import { AI_THEME_ENGINE_LAYOUT_KEYS } from "@/lib/theme-ai/capabilities";
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

test("the ten supported themes render saved AI overrides without mutating data", async () => {
  const customizedConfig = {
    ...careerThemeFixtureConfig,
    styleOverrides: {
      colorMode: "dark" as const,
      backgroundColor: "#101828",
      surfaceColor: "#1d2939",
      textColor: "#f9fafb",
      mutedTextColor: "#d0d5dd",
      accentColor: "#53b1fd",
      borderColor: "#344054",
      fontFamily: "Inter" as const,
      headingFontFamily: "Playfair Display" as const,
      headingScale: "large" as const,
      borderRadius: 24,
      spacing: "spacious" as const,
    },
  };
  const fullBefore = structuredClone(fullPortfolioFixture);
  const sparseBefore = structuredClone(sparsePortfolioFixture);

  assert.equal(AI_THEME_ENGINE_LAYOUT_KEYS.length, 10);

  for (const layoutKey of AI_THEME_ENGINE_LAYOUT_KEYS) {
    const Theme = await loadThemeComponent(layoutKey);
    assert.ok(Theme, `${layoutKey} should load`);

    for (const data of [fullPortfolioFixture, sparsePortfolioFixture]) {
      const html = renderToStaticMarkup(
        createElement(Theme, { config: customizedConfig, data }),
      );

      assert.match(html, /#101828/);
      assert.match(html, /#53b1fd/);
      assert.match(html, /--theme-heading-scale:1\.12/);
      assert.match(html, /data-ai-theme-customized="true"/);
      assert.match(html, new RegExp(`data-theme-layout="${layoutKey}"`));
    }
  }

  assert.deepEqual(fullPortfolioFixture, fullBefore);
  assert.deepEqual(sparsePortfolioFixture, sparseBefore);
});

test("default and unsupported themes never activate AI override styling", async () => {
  const firstSupported = AI_THEME_ENGINE_LAYOUT_KEYS[0];
  const firstUnsupported = "pavni-blue-beige-folders";
  const supportedTheme = await loadThemeComponent(firstSupported);
  const unsupportedTheme = await loadThemeComponent(firstUnsupported);
  assert.ok(supportedTheme);
  assert.ok(unsupportedTheme);

  const defaultHtml = renderToStaticMarkup(
    createElement(supportedTheme, {
      config: careerThemeFixtureConfig,
      data: fullPortfolioFixture,
    }),
  );
  assert.doesNotMatch(defaultHtml, /data-ai-theme-customized/);

  const unsupportedHtml = renderToStaticMarkup(
    createElement(unsupportedTheme, {
      config: {
        ...careerThemeFixtureConfig,
        styleOverrides: { backgroundColor: "#101828" },
      },
      data: fullPortfolioFixture,
    }),
  );
  assert.doesNotMatch(unsupportedHtml, /data-ai-theme-customized/);
  assert.doesNotMatch(unsupportedHtml, /#101828/);
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
