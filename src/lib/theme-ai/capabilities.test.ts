import assert from "node:assert/strict";
import test from "node:test";

import { defaultThemeConfig } from "@/themes/default-config";

import {
  AI_THEME_ENGINE_LAYOUT_KEYS,
  getEffectiveThemeAppearance,
  isAiThemeEngineSupported,
} from "./capabilities";

const EXPECTED_SUPPORTED_KEYS = [
  "pavni-professional-editorial",
  "pavni-modern-professional",
  "pavni-dynamic-bento",
  "pavni-creative-developer",
  "pavni-brown-red-scrapbook",
  "pavni-black-blue-startup",
  "pavni-webverse-collage",
  "pavni-illustrated-desk",
  "pavni-retro-desktop",
  "pavni-kinetic-gallery",
] as const;

test("AI Theme Engine support is pinned to the ten stable layout keys", () => {
  assert.deepEqual(AI_THEME_ENGINE_LAYOUT_KEYS, EXPECTED_SUPPORTED_KEYS);
  assert.equal(isAiThemeEngineSupported(EXPECTED_SUPPORTED_KEYS[0]), true);
  assert.equal(isAiThemeEngineSupported("pavni-blue-beige-folders"), false);
  assert.equal(isAiThemeEngineSupported("career-executive"), false);
});

test("only supported themes resolve the reversible override layer", () => {
  const config = {
    ...defaultThemeConfig,
    styleOverrides: {
      backgroundColor: "#101828",
      accentColor: "#7c3aed",
      headingScale: "large" as const,
    },
  };

  assert.equal(
    getEffectiveThemeAppearance(config, EXPECTED_SUPPORTED_KEYS[0])
      .backgroundColor,
    "#101828",
  );
  assert.strictEqual(
    getEffectiveThemeAppearance(config, "pavni-blue-beige-folders"),
    config.appearance,
  );
});
