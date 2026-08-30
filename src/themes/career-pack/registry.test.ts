import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
import type { ThemeConfig } from "@/types/theme";

import "../test/css-module-hook.cjs";

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

const POLISHED_LAYOUT_KEYS = EXPECTED_LAYOUT_KEYS.filter(
  (layoutKey) => layoutKey !== "career-content-creator",
);

const SIGNATURE_MARKERS: Readonly<Record<(typeof POLISHED_LAYOUT_KEYS)[number], RegExp>> = {
  "career-mechanical-engineer": /mechanicalAssembly/,
  "career-electrical-engineer": /electricalSchematic/,
  "career-finance-ca": /financeDashboard/,
  "career-legal-professional": /legalFolioMark/,
  "career-architect-designer": /architectDraft/,
  "career-healthcare-professional": /clinicalEcg/,
  "career-ai-data": /aiNetwork/,
  "career-product-designer": /productPrototype/,
  "career-business-consulting": /consultingGrowth/,
};

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
    assert.doesNotMatch(html, /\b(?:undefined|null)\b/);
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
    assert.doesNotMatch(html, /\b(?:undefined|null)\b/);
  }
});

test("remaining career themes respect section order, hidden content, and visibility", async () => {
  const constrainedConfig: ThemeConfig = {
    ...careerThemeFixtureConfig,
    sections: {
      order: [
        "skills",
        "summary",
        ...careerThemeFixtureConfig.sections.order.filter(
          (sectionKey) => sectionKey !== "skills" && sectionKey !== "summary",
        ),
      ],
      hidden: ["projects"],
    },
    visibility: {
      showProfileImage: false,
      showEmail: false,
      showPhone: false,
      showLocation: false,
      showLinks: false,
    },
  };
  const visibilityFixture = {
    ...fullPortfolioFixture,
    personal: {
      ...fullPortfolioFixture.personal,
      location: "Personal contact location",
    },
  };

  for (const layoutKey of POLISHED_LAYOUT_KEYS) {
    const Theme = await loadCareerThemeComponent(layoutKey);
    assert.ok(Theme);
    const html = renderToStaticMarkup(
      createElement(Theme, {
        config: constrainedConfig,
        data: visibilityFixture,
      }),
    );

    assert.ok(html.indexOf(">Skills<") < html.indexOf(">Profile<"));
    assert.doesNotMatch(html, />Projects</);
    assert.doesNotMatch(html, /Community Services Navigator/);
    assert.doesNotMatch(
      html,
      /avery@example\.com|\+1 555 010 2486|Personal contact location/,
    );
    assert.doesNotMatch(html, /linkedin\.com\/in\/example|avery-morgan\.webp/);
  }
});

test("switching career themes never mutates PortfolioData", async () => {
  const before = structuredClone(fullPortfolioFixture);

  for (const layoutKey of POLISHED_LAYOUT_KEYS.slice(0, 3)) {
    const Theme = await loadCareerThemeComponent(layoutKey);
    assert.ok(Theme);
    renderToStaticMarkup(
      createElement(Theme, {
        config: careerThemeFixtureConfig,
        data: fullPortfolioFixture,
      }),
    );
  }

  assert.deepEqual(fullPortfolioFixture, before);
});

test("career themes expose bounded motion through ThemeConfig", async () => {
  const dynamicConfig = {
    ...careerThemeFixtureConfig,
    appearance: {
      ...careerThemeFixtureConfig.appearance,
      animationIntensity: "dynamic" as const,
    },
  };

  for (const layoutKey of POLISHED_LAYOUT_KEYS) {
    const Theme = await loadCareerThemeComponent(layoutKey);
    assert.ok(Theme);
    const html = renderToStaticMarkup(
      createElement(Theme, { config: dynamicConfig, data: fullPortfolioFixture }),
    );
    assert.match(html, /data-animation="dynamic"/);
    assert.match(html, SIGNATURE_MARKERS[layoutKey]);
  }
});

test("remaining career themes keep safe links and reject unsafe protocols", async () => {
  const unsafeFixture = {
    ...fullPortfolioFixture,
    links: [
      ...fullPortfolioFixture.links,
      {
        id: "unsafe-link",
        type: "other" as const,
        label: "Unsafe",
        url: "javascript:alert(1)",
      },
    ],
  };

  for (const layoutKey of POLISHED_LAYOUT_KEYS) {
    const Theme = await loadCareerThemeComponent(layoutKey);
    assert.ok(Theme);
    const html = renderToStaticMarkup(
      createElement(Theme, {
        config: careerThemeFixtureConfig,
        data: unsafeFixture,
      }),
    );

    assert.match(html, /href="https:\/\/www\.linkedin\.com\/in\/example"/);
    assert.match(html, /rel="noreferrer noopener"/);
    assert.doesNotMatch(html, /javascript:/);
  }
});

test("career studio motion is configurable and respects reduced motion", () => {
  const css = readFileSync(
    new URL("./shared/career-studio.module.css", import.meta.url),
    "utf8",
  );

  assert.match(css, /\.root\[data-animation="none"\]/);
  assert.match(css, /\.root\[data-animation="subtle"\]/);
  assert.match(css, /\.root\[data-animation="dynamic"\]/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);

  for (const keyframe of [
    "mechanical-spin",
    "electrical-flow",
    "finance-bar-rise",
    "legal-mark",
    "architect-draw",
    "clinical-trace",
    "ai-data-flow",
    "product-panel-a",
    "consulting-draw",
  ]) {
    assert.match(css, new RegExp(`@keyframes ${keyframe}`));
  }
});

test("unknown career layout keys fail safely", async () => {
  assert.equal(getCareerThemeManifest("career-unknown"), null);
  assert.equal(await loadCareerThemeComponent("career-unknown"), null);
});
