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

test("the public home page presents the resume-to-portfolio product journey", () => {
  const home = readFileSync(
    fileURLToPath(new URL("../app/page.tsx", import.meta.url)),
    "utf8",
  );
  const styles = readFileSync(
    fileURLToPath(new URL("../app/page.module.css", import.meta.url)),
    "utf8",
  );

  assert.match(home, /ResumePhone/);
  assert.match(home, /PortfolioLaptop/);
  assert.match(home, /Resume in/);
  assert.match(home, /Portfolio out/);
  assert.match(home, /href="\/signup"/);
  assert.match(home, /href="\/login"/);
  assert.match(home, /id="how-it-works"/);
  assert.match(home, /id="features"/);
  assert.match(home, /id="themes"/);
  assert.match(styles, /@media \(max-width: 620px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("the production Theme Store is a gallery with resilient imagery and a focused live preview", () => {
  const store = readFileSync(
    fileURLToPath(new URL("../app/themes/ThemeStore.tsx", import.meta.url)),
    "utf8",
  );
  const styles = readFileSync(
    fileURLToPath(
      new URL("../app/themes/ThemeStore.module.css", import.meta.url),
    ),
    "utf8",
  );

  assert.match(store, /\/theme-previews\/\$\{entry\.layoutKey\}\.png/);
  assert.match(store, /className=\{styles\.themeGrid\}/);
  assert.match(store, /role="dialog"/);
  assert.match(store, /aria-modal="true"/);
  assert.match(store, /movePreview\(-1\)/);
  assert.match(store, /movePreview\(1\)/);
  assert.match(store, /selectPortfolioTheme\(/);
  assert.match(store, /publishPortfolio\(portfolioId\)/);
  assert.match(store, /LiveThemePreview/);
  assert.match(styles, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 620px\)/);
  assert.doesNotMatch(store, /career-pack\/dev\/fixtures/);
});
