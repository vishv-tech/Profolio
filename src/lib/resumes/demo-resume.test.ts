import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { PortfolioDataSchema } from "@/lib/validation/portfolio";

import {
  isVishvDemoResume,
  shouldUseVishvDemoResume,
} from "./demo-resume-match";
import {
  DEMO_RESUME_MIN_PROCESSING_MS,
  remainingDemoResumeDelayMs,
  waitForDemoResumeMinimum,
} from "./demo-resume-timing";
import { buildDemoVishvPortfolio } from "./demo-vishv-resume";

const exactResumeText = `
  VISHV DEEPAK LANGE
  vishvlange843@gmail.com
  https://github.com/vishv-tech
`;

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
}

test("demo mode off keeps the exact Vishv resume on the normal extraction path", () => {
  assert.equal(shouldUseVishvDemoResume(exactResumeText, false), false);
});

test("demo mode on keeps an unrelated resume on the normal extraction path", () => {
  assert.equal(
    shouldUseVishvDemoResume(
      "Asha Rao\nasha@example.com\ngithub.com/asha/example",
      true,
    ),
    false,
  );
});

test("the word Vishv alone is not enough to select the demo fixture", () => {
  assert.equal(isVishvDemoResume("Vishv"), false);
});

test("the full name plus one exact contact marker selects the demo fixture", () => {
  assert.equal(isVishvDemoResume(exactResumeText), true);
  assert.equal(
    isVishvDemoResume(
      "vishv   deepak\nLANGE\nlinkedin.com/in/vishv-lange-a781352b7",
    ),
    true,
  );
});

test("the deterministic fixture validates through canonical PortfolioData", () => {
  const portfolio = buildDemoVishvPortfolio();

  assert.equal(PortfolioDataSchema.safeParse(portfolio).success, true);
  assert.deepEqual(portfolio, buildDemoVishvPortfolio());
  assert.equal(
    new Set([
      ...portfolio.education,
      ...portfolio.projects,
      ...portfolio.skills,
      ...portfolio.certifications,
      ...portfolio.links,
      ...portfolio.languages,
    ].map((item) => item.id)).size,
    22,
  );
});

test("the fixture contains every supported identity, education, skill, and language fact", () => {
  const portfolio = buildDemoVishvPortfolio();

  assert.deepEqual(portfolio.personal, {
    fullName: "Vishv Deepak Lange",
    headline: "B.SC. IT STUDENT | AI AUTOMATION | FULL-STACK DEVELOPMENT",
    email: "vishvlange843@gmail.com",
    phone: "9892829923",
    location: "Mumbai, India",
    profileImageUrl: "",
  });
  assert.equal(portfolio.education[0]?.institution, "Guru Nanak Khalsa College, Mumbai");
  assert.equal(portfolio.education[0]?.degree, "B.Sc. Information Technology");
  assert.equal(portfolio.education[0]?.description, "3rd Year");
  assert.deepEqual(
    portfolio.skills.map(({ category }) => category),
    ["Languages", "Frontend", "Backend & DB", "AI & Tools", "Other"],
  );
  assert.deepEqual(
    portfolio.languages.map(({ name }) => name),
    ["English", "Hindi", "Marathi"],
  );
});

test("the fixture contains all eight projects and three supported certifications", () => {
  const portfolio = buildDemoVishvPortfolio();

  assert.deepEqual(
    portfolio.projects.map(({ name }) => name),
    [
      "VibeCode Studio - Multi-Agent AI Coding Workspace",
      "Parkbnb - Parking Booking Web Platform",
      "Brandon.AI - AI Fashion & Product Content Studio",
      "Szocial - Local Community & Business Discovery Platform",
      "Detective.ai",
      "SAGE AI - Multi-Agent AI Development Assistant",
      "MovieVerse - Movie Discovery & Watchlist Platform",
      "AwaazPay - UPI Voice Payment Alert App",
    ],
  );
  assert.equal(portfolio.projects.every((project) => project.description.length > 0), true);
  assert.equal(portfolio.projects.every((project) => project.highlights.length > 0), true);
  assert.deepEqual(
    portfolio.certifications.map(({ issueDate }) => issueDate),
    ["", "2025-11", "2025-12"],
  );
});

test("the fixture leaves unsupported experience, achievements, dates, URLs, and metrics empty", () => {
  const portfolio = buildDemoVishvPortfolio();

  assert.deepEqual(portfolio.experience, []);
  assert.deepEqual(portfolio.achievements, []);
  assert.equal(
    portfolio.projects.every(
      (project) =>
        !project.projectUrl &&
        !project.githubUrl &&
        !project.startDate &&
        !project.endDate,
    ),
    true,
  );
  assert.equal(
    portfolio.certifications.every(
      (certification) =>
        !certification.credentialId &&
        !certification.credentialUrl &&
        !certification.expiryDate,
    ),
    true,
  );
  assert.doesNotMatch(
    JSON.stringify(portfolio),
    /\b(?:GPA|revenue|increased by)\b|\d+(?:\.\d+)?%/iu,
  );
});

test("the matched branch returns before Gemini while normal resumes retain Gemini extraction", () => {
  const extraction = source("../ai/resume-extraction.ts");
  const fixture = source("./demo-vishv-resume.ts");
  const fixtureServerBoundary = source("./demo-vishv-resume.server.ts");
  const config = source("../demo/config.ts");
  const functionBody = extraction.slice(
    extraction.indexOf("export async function extractPortfolioFromPdf"),
  );

  assert.ok(
    functionBody.indexOf("shouldUseVishvDemoResume") <
      functionBody.indexOf("prepareGeminiSource"),
  );
  assert.match(functionBody, /return portfolio;[\s\S]*prepareGeminiSource/);
  assert.match(functionBody, /requestExtraction\(/);
  assert.doesNotMatch(fixture, /requestExtraction|generateContent|GEMINI_API_KEY/);
  assert.match(fixtureServerBoundary, /import "server-only"/);
  assert.match(config, /import "server-only"/);
  assert.match(config, /process\.env\.PROFOLIO_DEMO_MODE === "true"/);
});

test("the demo minimum duration uses a fake delay without slowing the test suite", async () => {
  const delays: number[] = [];
  const controller = new AbortController();

  assert.equal(DEMO_RESUME_MIN_PROCESSING_MS, 20_000);
  assert.equal(remainingDemoResumeDelayMs(1_000, 6_000), 15_000);
  assert.equal(remainingDemoResumeDelayMs(1_000, 25_000), 0);
  assert.equal(
    await waitForDemoResumeMinimum(1_000, {
      delay: async (durationMs) => {
        delays.push(durationMs);
      },
      now: () => 6_000,
    }),
    15_000,
  );
  assert.deepEqual(delays, [15_000]);

  controller.abort(new Error("cancelled"));
  await assert.rejects(
    waitForDemoResumeMinimum(1_000, {
      now: () => 6_000,
      signal: controller.signal,
    }),
    /cancelled/,
  );
});
