import assert from "node:assert/strict";
import test from "node:test";

import { fullPortfolioFixture } from "@/themes/career-pack/dev/fixtures";
import { defaultThemeConfig } from "@/themes/default-config";

import {
  applyThemeStylePatch,
  replaceThemeStyleOverrides,
  themeConfigsEqual,
} from "./patch";

test("merges sequential patches into the current ThemeConfig", () => {
  const first = applyThemeStylePatch(defaultThemeConfig, {
    backgroundColor: "#0F172A",
    textColor: "#F8FAFC",
    accentColor: "#3B82F6",
  });
  assert.ok(first);

  const second = applyThemeStylePatch(first, {
    headingScale: "large",
    borderRadius: 24,
  });
  assert.ok(second);
  assert.deepEqual(second.appearance, defaultThemeConfig.appearance);
  assert.equal(second.styleOverrides?.backgroundColor, "#0f172a");
  assert.equal(second.styleOverrides?.accentColor, "#3b82f6");
  assert.equal(second.styleOverrides?.headingScale, "large");
  assert.equal(second.styleOverrides?.borderRadius, 24);
});

test("style patching preserves sections, visibility, and PortfolioData", () => {
  const configBefore = structuredClone(defaultThemeConfig);
  const portfolioBefore = structuredClone(fullPortfolioFixture);
  const result = applyThemeStylePatch(configBefore, {
    spacing: "compact",
    fontFamily: "Inter",
  });

  assert.ok(result);
  assert.deepEqual(result.sections, configBefore.sections);
  assert.deepEqual(result.visibility, configBefore.visibility);
  assert.deepEqual(fullPortfolioFixture, portfolioBefore);
  assert.deepEqual(configBefore, defaultThemeConfig);
});

test("override replacement supports one-step undo without changing the baseline", () => {
  const dark = applyThemeStylePatch(defaultThemeConfig, {
    backgroundColor: "#101828",
    headingScale: "large",
  });
  assert.ok(dark);
  const red = applyThemeStylePatch(dark, { backgroundColor: "#991b1b" });
  assert.ok(red);

  const restored = replaceThemeStyleOverrides(
    red,
    dark.styleOverrides ?? null,
  );
  assert.ok(restored);
  assert.deepEqual(restored.appearance, defaultThemeConfig.appearance);
  assert.deepEqual(restored.styleOverrides, dark.styleOverrides);
  assert.deepEqual(restored.sections, red.sections);
  assert.deepEqual(restored.visibility, red.visibility);

  const reset = replaceThemeStyleOverrides(restored, null);
  assert.ok(reset);
  assert.equal("styleOverrides" in reset, false);
  assert.equal(themeConfigsEqual(reset, defaultThemeConfig), true);
});

test("invalid patches never produce a partial ThemeConfig", () => {
  assert.equal(
    applyThemeStylePatch(defaultThemeConfig, {
      accentColor: "url(javascript:alert(1))",
    }),
    null,
  );
  assert.equal(
    applyThemeStylePatch(defaultThemeConfig, {
      headingScale: "enormous",
    }),
    null,
  );
});
