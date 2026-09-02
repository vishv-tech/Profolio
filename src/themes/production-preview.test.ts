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

test("temporary theme previews sync the URL without App Router navigation", () => {
  const store = readFileSync(
    fileURLToPath(new URL("../app/themes/ThemeStore.tsx", import.meta.url)),
    "utf8",
  );
  const page = readFileSync(
    fileURLToPath(new URL("../app/themes/page.tsx", import.meta.url)),
    "utf8",
  );
  const handlerStart = store.indexOf("  function setPreviewTheme(");
  const handlerEnd = store.indexOf("\n  function movePreview(", handlerStart);

  assert.ok(handlerStart >= 0 && handlerEnd > handlerStart);

  const previewHandler = store.slice(handlerStart, handlerEnd);

  assert.match(previewHandler, /window\.history\.replaceState\(/);
  assert.doesNotMatch(previewHandler, /router\.(?:push|replace|refresh)\(/);
  assert.match(
    previewHandler,
    /portfolio=\$\{encodeURIComponent\(portfolioId\)\}&theme=\$\{encodeURIComponent\(nextLayoutKey\)\}/,
  );
  assert.match(page, /typeof params\.theme === "string"/);
  assert.match(
    page,
    /resolveThemeLayoutKey\(\s*requestedLayoutKey,\s*savedLayoutKey,\s*\)/,
  );
});

test("saving a theme preserves the open preview and reconciles saved state locally", () => {
  const store = readFileSync(
    fileURLToPath(new URL("../app/themes/ThemeStore.tsx", import.meta.url)),
    "utf8",
  );
  const page = readFileSync(
    fileURLToPath(new URL("../app/themes/page.tsx", import.meta.url)),
    "utf8",
  );
  const action = readFileSync(
    fileURLToPath(new URL("../app/themes/actions.ts", import.meta.url)),
    "utf8",
  );
  const handlerStart = store.indexOf("  function saveTheme(");
  const handlerEnd = store.indexOf(
    "\n  function publishSavedPortfolio(",
    handlerStart,
  );

  assert.ok(handlerStart >= 0 && handlerEnd > handlerStart);

  const saveHandler = store.slice(handlerStart, handlerEnd);

  assert.match(saveHandler, /selectPortfolioTheme\(/);
  assert.match(saveHandler, /setConfigOverrides\(/);
  assert.match(saveHandler, /setSavedLayoutKey\(result\.layoutKey\)/);
  assert.match(saveHandler, /tone: "success"/);
  assert.match(saveHandler, /window\.history\.replaceState\(/);
  assert.doesNotMatch(saveHandler, /router\.(?:push|replace|refresh)\(/);
  assert.doesNotMatch(saveHandler, /setPreviewOpen\(false\)/);
  assert.match(page, /key=\{result\.portfolio\.id\}/);
  assert.doesNotMatch(page, /key=\{initialLayoutKey\}/);
  assert.doesNotMatch(action, /revalidatePath\("\/themes"\)/);
  assert.match(action, /revalidatePath\("\/dashboard"\)/);
});

test("save and publish failures keep preview controls available for retry", () => {
  const store = readFileSync(
    fileURLToPath(new URL("../app/themes/ThemeStore.tsx", import.meta.url)),
    "utf8",
  );
  const saveStart = store.indexOf("  function saveTheme(");
  const publishStart = store.indexOf(
    "\n  function publishSavedPortfolio(",
    saveStart,
  );
  const handlersEnd = store.indexOf("\n  if (!selected || !selectedConfig)", publishStart);

  assert.ok(
    saveStart >= 0 && publishStart > saveStart && handlersEnd > publishStart,
  );

  const saveHandler = store.slice(saveStart, publishStart);
  const publishHandler = store.slice(publishStart, handlersEnd);

  assert.match(saveHandler, /tone: "error"/);
  assert.doesNotMatch(saveHandler, /setPreviewOpen\(false\)/);
  assert.match(publishHandler, /publishPortfolio\(portfolioId\)/);
  assert.match(publishHandler, /tone: "error"/);
  assert.doesNotMatch(publishHandler, /setPreviewOpen\(false\)/);
  assert.match(
    publishHandler,
    /router\.push\(\s*`\/dashboard\?portfolio=\$\{encodeURIComponent\(portfolioId\)\}&published=1`/,
  );
  assert.match(store, /disabled=\{!selectedIsSaved \|\| isPublishing\}/);
  assert.match(store, /\{selectedIsSaved \? "Theme selected" : "Use this theme"\}/);
});
