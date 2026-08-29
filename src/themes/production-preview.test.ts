import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { defaultThemeConfig } from "@/themes/default-config";
import { loadThemeComponent } from "@/themes/registry";
import type { PortfolioData } from "@/types/portfolio";

import "./test/css-module-hook.cjs";

const mugdhaPortfolio: PortfolioData = {
  personal: {
    fullName: "MUGDHA SANDEEP TOPRE",
    headline: "B.Sc. Information Technology Student",
    email: "mugdha@example.test",
    phone: "",
    location: "Mumbai, India",
    profileImageUrl: "",
  },
  summary: "Information technology student building thoughtful digital products.",
  experience: [],
  education: [],
  projects: [],
  skills: [],
  achievements: [],
  certifications: [],
  links: [],
  languages: [],
  interests: [],
  customSections: [],
};

test("production preview themes render supplied Mugdha data without Avery fixtures", async () => {
  const selectedLayouts = [
    "pavni-professional-editorial",
    "pavni-dynamic-bento",
    "pavni-retro-desktop",
    "career-ai-data",
  ];
  const originalData = structuredClone(mugdhaPortfolio);

  for (const layoutKey of selectedLayouts) {
    const Theme = await loadThemeComponent(layoutKey);
    assert.ok(Theme, `${layoutKey} should resolve through the unified registry`);

    const html = renderToStaticMarkup(
      createElement(Theme, {
        config: defaultThemeConfig,
        data: mugdhaPortfolio,
      }),
    );

    assert.ok(
      html.includes("MUGDHA SANDEEP TOPRE"),
      `${layoutKey} should render the supplied portfolio identity`,
    );
    assert.doesNotMatch(html, /Avery Morgan/);
  }

  assert.deepEqual(mugdhaPortfolio, originalData);
});

test("production theme routes do not import development PortfolioData fixtures", () => {
  const productionFiles = [
    "../app/themes/page.tsx",
    "../app/themes/ThemeStore.tsx",
    "../app/p/[slug]/page.tsx",
  ].map((path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8"));
  const source = productionFiles.join("\n");

  assert.doesNotMatch(source, /career-pack\/dev\/fixtures/);
  assert.doesNotMatch(source, /fullPortfolioFixture|sparsePortfolioFixture/);
  assert.doesNotMatch(source, /Avery Morgan/);
});
