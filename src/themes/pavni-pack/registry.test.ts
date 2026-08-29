import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  careerThemeFixtureConfig,
  fullPortfolioFixture,
  sparsePortfolioFixture,
} from "@/themes/career-pack/dev/fixtures";
import type { PortfolioData } from "@/types/portfolio";
import type { PortfolioSectionKey, ThemeConfig } from "@/types/theme";

import { SafeProfileImage } from "./shared";
import {
  getPavniThemeManifest,
  loadPavniThemeComponent,
  pavniThemePack,
  pavniThemeRegistry,
} from "./registry";
import type { PavniThemeLayoutKey } from "./types";

import "../test/css-module-hook.cjs";

const EXPECTED_LAYOUT_KEYS = [
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
  "pavni-blue-beige-folders",
  "pavni-striped-notes",
  "pavni-color-cutout",
  "pavni-mono-echo",
  "pavni-navy-pitch",
  "pavni-orbit-sketch",
  "pavni-geo-signal",
  "pavni-noir-creator",
  "pavni-soft-focus-studio",
  "pavni-blue-red-script",
  "pavni-lime-ledger",
  "pavni-midnight-sun",
  "pavni-fuchsia-archive",
  "pavni-sage-terminal",
  "pavni-coral-circuit",
] as const satisfies readonly PavniThemeLayoutKey[];

const EXPECTED_FULL_CONTENT = [
  "Avery Morgan",
  "I turn ambiguous customer and business problems",
  "Northstar Works",
  "Lead Strategist",
  "Full-time",
  "Lead multidisciplinary teams",
  "Launched a new service line",
  "Lakeshore University",
  "Master of Design",
  "Strategic Innovation",
  "Distinction",
  "Focused on systems thinking",
  "Community Services Navigator",
  "A service and digital product",
  "Service design",
  "Validated with 42 residents",
  "example.com/projects/services-navigator",
  "github.com/example/operations-signal",
  "Research synthesis",
  "Emerging Leader Award",
  "Regional Design Council",
  "Certified Change Practitioner",
  "Practice Institute",
  "CCP-1042",
  "linkedin.com/in/example",
  "English",
  "Professional",
  "Documentary photography",
  "Community work",
  "Volunteer mentor",
  "Open Practice Network",
] as const;

async function renderTheme(
  layoutKey: PavniThemeLayoutKey,
  data: PortfolioData = fullPortfolioFixture,
  config: ThemeConfig = careerThemeFixtureConfig,
) {
  const Theme = await loadPavniThemeComponent(layoutKey);
  assert.ok(Theme, `Expected ${layoutKey} to lazy-load`);

  return renderToStaticMarkup(createElement(Theme, { config, data }));
}

function configWith({
  hidden = careerThemeFixtureConfig.sections.hidden,
  order = careerThemeFixtureConfig.sections.order,
  visibility = careerThemeFixtureConfig.visibility,
}: {
  hidden?: PortfolioSectionKey[];
  order?: PortfolioSectionKey[];
  visibility?: ThemeConfig["visibility"];
}): ThemeConfig {
  return {
    ...careerThemeFixtureConfig,
    sections: { hidden, order },
    visibility,
  };
}

function collectThemeSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      return collectThemeSources(path);
    }

    return entry.name.endsWith(".tsx") ? [readFileSync(path, "utf8")] : [];
  });
}

test("registers the exact 25 unique namespaced Pavni themes", () => {
  const registeredKeys = pavniThemePack.map((theme) => theme.layoutKey);

  assert.deepEqual(registeredKeys, EXPECTED_LAYOUT_KEYS);
  assert.equal(new Set(registeredKeys).size, EXPECTED_LAYOUT_KEYS.length);
  assert.equal(pavniThemeRegistry.size, EXPECTED_LAYOUT_KEYS.length);

  for (const manifest of pavniThemePack) {
    assert.ok(manifest.layoutKey.startsWith("pavni-"));
    assert.ok(manifest.name.trim());
    assert.ok(manifest.description.trim());
    assert.ok(manifest.careerTags.length > 0);
    assert.ok(manifest.styleTags.length > 0);
    assert.equal(manifest.previewImage, undefined);
    assert.strictEqual(getPavniThemeManifest(manifest.layoutKey), manifest);
  }
});

test("lazy-loads and renders every Pavni theme with every full fixture field", async () => {
  for (const layoutKey of EXPECTED_LAYOUT_KEYS) {
    const html = await renderTheme(layoutKey);

    assert.match(html, new RegExp(`data-theme-layout="${layoutKey}"`));
    assert.match(html, /<main\b/);
    assert.match(html, /<h1\b/);
    assert.doesNotMatch(html, /\b(?:undefined|null)\b/);

    for (const value of EXPECTED_FULL_CONTENT) {
      assert.ok(
        html.includes(value),
        `${layoutKey} did not render fixture content: ${value}`,
      );
    }
  }
});

test("renders every Pavni theme safely with the sparse fixture", async () => {
  for (const layoutKey of EXPECTED_LAYOUT_KEYS) {
    const html = await renderTheme(layoutKey, sparsePortfolioFixture);

    assert.match(html, /Jordan/);
    assert.match(html, /Lee/);
    assert.doesNotMatch(html, /\b(?:undefined|null)\b/);
    assert.doesNotMatch(html, /data-section-key="(?:experience|education|projects|skills|achievements|certifications|languages|interests|customSections)"/);
    assert.doesNotMatch(html, /<img\b/);
  }
});

test("contains no public owner image-editing controls", async () => {
  const packDirectory = fileURLToPath(new URL(".", import.meta.url));
  const source = collectThemeSources(packDirectory).join("\n");

  assert.doesNotMatch(
    source,
    /createObjectURL|FileReader|type\s*=\s*(?:["']file["']|\{\s*["']file["']\s*\})/i,
  );
  assert.doesNotMatch(source, /\b(?:upload|replace)\s+(?:an?\s+)?image\b/i);

  for (const layoutKey of EXPECTED_LAYOUT_KEYS) {
    const html = await renderTheme(layoutKey);
    assert.doesNotMatch(html, /<input\b[^>]*\btype="file"/i);
    assert.doesNotMatch(html, /\b(?:upload|replace)\s+(?:an?\s+)?image\b/i);
  }
});

test("respects link and contact visibility in every Pavni theme", async () => {
  const privateContactData: PortfolioData = {
    ...fullPortfolioFixture,
    personal: {
      ...fullPortfolioFixture.personal,
      email: "private-contact@example.invalid",
      phone: "+99 867 5309",
      location: "Private Contact Location",
      profileImageUrl: "https://images.example.com/private-owner.webp",
    },
    links: [
      {
        id: "private-link",
        type: "other",
        label: "Private profile",
        url: "https://social.example.test/private-profile",
      },
    ],
  };
  const hiddenContactConfig = configWith({
    visibility: {
      showProfileImage: false,
      showEmail: false,
      showPhone: false,
      showLocation: false,
      showLinks: false,
    },
  });

  for (const layoutKey of EXPECTED_LAYOUT_KEYS) {
    const visibleHtml = await renderTheme(layoutKey);
    assert.match(visibleHtml, /linkedin\.com\/in\/example/);

    const hiddenHtml = await renderTheme(
      layoutKey,
      privateContactData,
      hiddenContactConfig,
    );
    assert.doesNotMatch(hiddenHtml, /private-contact@example\.invalid/);
    assert.doesNotMatch(hiddenHtml, /\+99 867 5309/);
    assert.doesNotMatch(hiddenHtml, /Private Contact Location/);
    assert.doesNotMatch(hiddenHtml, /images\.example\.com\/private-owner/);
    assert.doesNotMatch(hiddenHtml, /social\.example\.test\/private-profile/);
  }
});

test("honors hidden sections without leaving content shells", async () => {
  const config = configWith({ hidden: ["projects", "experience", "skills"] });

  for (const layoutKey of EXPECTED_LAYOUT_KEYS) {
    const html = await renderTheme(layoutKey, fullPortfolioFixture, config);

    assert.doesNotMatch(html, /data-section-key="(?:projects|experience|skills)"/);
    assert.doesNotMatch(html, /Community Services Navigator/);
    assert.doesNotMatch(html, /Northstar Works/);
    assert.doesNotMatch(html, /Research synthesis/);
  }
});

test("honors a changed content-section order in every Pavni theme", async () => {
  const changedOrder: PortfolioSectionKey[] = [
    "skills",
    "education",
    "experience",
    "summary",
    "projects",
    "certifications",
    "achievements",
    "languages",
    "interests",
    "customSections",
  ];
  const config = configWith({ order: changedOrder });

  for (const layoutKey of EXPECTED_LAYOUT_KEYS) {
    const html = await renderTheme(layoutKey, fullPortfolioFixture, config);
    const positions = changedOrder.map((section) =>
      html.indexOf(`data-section-key="${section}"`),
    );

    assert.ok(positions.every((position) => position >= 0));
    assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  }
});

test("uses safe profile-image fallbacks", () => {
  const unsafeHtml = renderToStaticMarkup(
    createElement(SafeProfileImage, {
      alt: "Unsafe portrait",
      fallback: createElement("span", null, "AM"),
      imageUrl: "javascript:alert(1)",
      showImage: true,
    }),
  );
  const hiddenHtml = renderToStaticMarkup(
    createElement(SafeProfileImage, {
      alt: "Hidden portrait",
      fallback: createElement("span", null, "AM"),
      imageUrl: "https://images.example.com/portrait.jpg",
      showImage: false,
    }),
  );

  assert.equal(unsafeHtml, "<span>AM</span>");
  assert.equal(hiddenHtml, "<span>AM</span>");
});

test("unknown Pavni layout keys fail safely", async () => {
  assert.equal(getPavniThemeManifest("pavni-unknown"), null);
  assert.equal(await loadPavniThemeComponent("pavni-unknown"), null);
});
