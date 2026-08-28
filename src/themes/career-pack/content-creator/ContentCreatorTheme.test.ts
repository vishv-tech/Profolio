import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  careerThemeFixtureConfig,
  fullPortfolioFixture,
  sparsePortfolioFixture,
} from "../dev/fixtures";
import ContentCreatorTheme from "./ContentCreatorTheme";

function renderTheme(
  data = fullPortfolioFixture,
  config = careerThemeFixtureConfig,
) {
  return renderToStaticMarkup(createElement(ContentCreatorTheme, { config, data }));
}

test("content creator theme renders the supported profile image mode", () => {
  const html = renderTheme();

  assert.match(html, /data-portrait-mode="image"/);
  assert.match(html, /images\.example\.com\/avery-morgan\.webp/);
  assert.match(html, /data-section-key="projects"/);
  assert.match(html, /\.cc-root \{/);
  assert.match(html, /class="[^"]*cc-root/);
});

test("content creator theme uses a typographic portrait when no image exists", () => {
  const html = renderTheme({
    ...sparsePortfolioFixture,
    personal: {
      ...sparsePortfolioFixture.personal,
      profileImageUrl: "",
    },
  });

  assert.match(html, /data-portrait-mode="fallback"/);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /Jordan Lee/);
});

test("content creator theme respects contact, link, and image visibility", () => {
  const html = renderTheme(fullPortfolioFixture, {
    ...careerThemeFixtureConfig,
    visibility: {
      showProfileImage: false,
      showEmail: false,
      showPhone: false,
      showLocation: false,
      showLinks: false,
    },
  });

  assert.doesNotMatch(html, /data-portrait-mode/);
  assert.doesNotMatch(html, /aria-label="Creator links"/);
  assert.doesNotMatch(html, /aria-label="Contact details"/);
  assert.doesNotMatch(html, /avery@example\.com/);
  assert.doesNotMatch(html, /\+1 555 010 2486/);
});

test("content creator theme follows configured section order and hiding", () => {
  const html = renderTheme(fullPortfolioFixture, {
    ...careerThemeFixtureConfig,
    sections: {
      order: ["projects", "summary"],
      hidden: ["experience"],
    },
  });
  const projectPosition = html.indexOf('data-section-key="projects"');
  const summaryPosition = html.indexOf('data-section-key="summary"');

  assert.ok(projectPosition >= 0);
  assert.ok(summaryPosition > projectPosition);
  assert.doesNotMatch(html, /data-section-key="experience"/);
});

test("content creator theme survives empty sections and long creative-work copy", () => {
  const longDescription = `Opening context. ${"Detailed project context ".repeat(80)}Final outcome.`;
  const html = renderTheme({
    ...sparsePortfolioFixture,
    summary: "",
    education: [fullPortfolioFixture.education[0]],
    projects: [
      {
        ...fullPortfolioFixture.projects[0],
        description: longDescription,
      },
    ],
  });

  assert.doesNotMatch(html, /data-section-key="summary"/);
  assert.match(html, /data-section-key="projects"/);
  assert.match(html, /data-section-key="education"/);
  assert.match(html, /Final outcome\./);
});
