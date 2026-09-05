import assert from "node:assert/strict";
import test from "node:test";

import { sanitizePortfolioForIntelligence } from "./context";
import { buildDeterministicUpgradePlan } from "./deterministic-upgrade-plan";
import { ModelAttemptTimeoutError } from "@/lib/ai/model-fallback";
import {
  applyContentImprovementPatch,
  readContentImprovementTarget,
} from "./patches";
import { createContentImprovementPrompt } from "./prompts";
import {
  ContentImprovementPatchSchema,
  ContentImprovementTargetSchema,
  PortfolioUpgradePlanSchema,
} from "./schemas";
import {
  generateContentImprovement,
  generatePortfolioUpgradePlan,
  generateReliablePortfolioUpgradePlan,
} from "./service";
import { scorePortfolio } from "@/lib/portfolio-score/score";
import type { PortfolioData } from "@/types/portfolio";

function portfolio(): PortfolioData {
  return {
    personal: {
      fullName: "Asha Rao",
      headline: "Software engineering student",
      email: "asha@example.com",
      phone: "+91 90000 00000",
      location: "Bengaluru",
      profileImageUrl: "https://private.example.com/asha.jpg",
    },
    summary: "Built a website for students and documented the design decisions.",
    experience: [
      {
        id: "experience-1",
        company: "Example Lab",
        role: "Student developer",
        employmentType: "Internship",
        location: "Bengaluru",
        startDate: "2025-01",
        endDate: "2025-04",
        isCurrent: false,
        description: "Worked with a small team to improve an internal student website.",
        highlights: ["Documented interface decisions for the project team."],
      },
    ],
    education: [],
    projects: [
      {
        id: "project-1",
        name: "Student website",
        description: "Built a website for students.",
        technologies: ["TypeScript", "React"],
        highlights: ["Created reusable interface components."],
        projectUrl: "https://private.example.com/project",
        githubUrl: "https://github.com/asha/project",
        startDate: "2025",
        endDate: "2025",
      },
    ],
    skills: [{ id: "skills-1", category: "Frontend", items: ["React", "TypeScript"] }],
    achievements: [],
    certifications: [
      {
        id: "certification-1",
        name: "Course certificate",
        issuer: "Example School",
        issueDate: "2025",
        expiryDate: "",
        credentialId: "private-credential",
        credentialUrl: "https://private.example.com/credential",
      },
    ],
    links: [
      {
        id: "link-1",
        type: "linkedin",
        label: "LinkedIn",
        url: "https://linkedin.com/in/asha-private",
      },
    ],
    languages: [],
    interests: [],
    customSections: [],
  };
}

const summaryTarget = {
  section: "summary" as const,
  itemId: null,
  field: "summary" as const,
  listIndex: null,
  original: "Built a website for students and documented the design decisions.",
};

const validPlan = {
  overview: "The portfolio has a clear early-career direction and can show more evidence.",
  strengths: ["The project and current skills support the stated direction."],
  priorities: [
    {
      area: "projects",
      priority: "high",
      title: "Clarify project contribution",
      reason: "The project description is brief.",
      recommendation: "Describe the verified problem, contribution, and outcome without adding metrics.",
    },
  ],
  skillSuggestions: ["Group demonstrated frontend skills by how they were used."],
  projectIdeas: ["Consider a small accessibility audit project if it supports your goals."],
  certificationIdeas: ["Explore relevant certifications only if they align with your target role."],
  professionalPresence: ["Keep the LinkedIn profile aligned with the same factual project story."],
};

test("upgrade-plan context removes direct contact details and raw URLs", () => {
  const sanitized = JSON.stringify(sanitizePortfolioForIntelligence(portfolio()));

  assert.doesNotMatch(sanitized, /asha@example|90000|private\.example|linkedin\.com|credentialId|profileImageUrl/);
  assert.match(sanitized, /Software engineering student|Student website|linkedin/);
});

test("a valid mocked structured upgrade plan is accepted without mutating input", async () => {
  const data = portfolio();
  const before = structuredClone(data);
  let calls = 0;
  const plan = await generatePortfolioUpgradePlan(
    data,
    scorePortfolio(data),
    async () => {
      calls += 1;
      return JSON.stringify(validPlan);
    },
  );

  assert.deepEqual(plan, validPlan);
  assert.equal(calls, 1);
  assert.deepEqual(data, before);
});

test("reliable upgrade generation returns AI output without building a fallback", async () => {
  const data = portfolio();
  let fallbackCalls = 0;
  const result = await generateReliablePortfolioUpgradePlan(
    data,
    scorePortfolio(data),
    async () => JSON.stringify(validPlan),
    () => {
      fallbackCalls += 1;
      return PortfolioUpgradePlanSchema.parse(validPlan);
    },
  );

  assert.deepEqual(result, { plan: validPlan, source: "ai" });
  assert.equal(fallbackCalls, 0);
});

for (const [label, error] of [
  ["503 chain exhaustion", Object.assign(new Error("unavailable"), { status: 503 })],
  ["504 deadline", Object.assign(new Error("deadline"), { status: 504 })],
  ["attempt timeout", new ModelAttemptTimeoutError("gemini-3.5-flash", 30_000)],
] as const) {
  test(`${label} returns a validated deterministic upgrade plan`, async () => {
    const data = portfolio();
    const result = await generateReliablePortfolioUpgradePlan(
      data,
      scorePortfolio(data),
      async () => {
        throw error;
      },
    );

    assert.equal(result.source, "deterministic-fallback");
    assert.equal(PortfolioUpgradePlanSchema.safeParse(result.plan).success, true);
  });
}

test("invalid AI output degrades to the same deterministic analysis plan", async () => {
  const data = portfolio();
  const score = scorePortfolio(data);
  const result = await generateReliablePortfolioUpgradePlan(
    data,
    score,
    async () => "{}",
  );

  assert.equal(result.source, "deterministic-fallback");
  assert.deepEqual(result.plan, buildDeterministicUpgradePlan(data, score));
});

test("the deterministic plan uses real score gaps without mutating portfolio data", () => {
  const data = portfolio();
  data.personal.headline = "";
  data.projects[0]!.description = "Short";
  const before = structuredClone(data);
  const score = scorePortfolio(data);
  const plan = buildDeterministicUpgradePlan(data, score);
  const serialized = JSON.stringify(plan);

  assert.equal(PortfolioUpgradePlanSchema.safeParse(plan).success, true);
  assert.match(plan.overview, new RegExp(`${score.score}/100`));
  assert.equal(
    plan.priorities.some(
      (priority) =>
        priority.recommendation ===
        score.suggestions.find((suggestion) => suggestion.id === "profile-headline")
          ?.message,
    ),
    true,
  );
  assert.match(serialized, /Student website|LinkedIn/);
  assert.doesNotMatch(serialized, /5,000|revenue|increased by|award-winning/iu);
  assert.deepEqual(data, before);
});

test("invalid AI upgrade output is rejected and provider errors remain isolated", async () => {
  const data = portfolio();
  assert.equal(
    await generatePortfolioUpgradePlan(data, scorePortfolio(data), async () => "{}"),
    null,
  );
  await assert.rejects(
    generatePortfolioUpgradePlan(data, scorePortfolio(data), async () => {
      throw new Error("provider unavailable");
    }),
    /provider unavailable/,
  );
});

test("strict schemas reject extra fields and invalid content targets", () => {
  assert.equal(PortfolioUpgradePlanSchema.safeParse({ ...validPlan, factualClaim: "invented" }).success, false);
  assert.equal(
    ContentImprovementTargetSchema.safeParse({
      ...summaryTarget,
      section: "projects",
      itemId: null,
    }).success,
    false,
  );
  assert.equal(
    ContentImprovementPatchSchema.safeParse({
      ...summaryTarget,
      suggested: "",
      reason: "Better wording.",
    }).success,
    false,
  );
});

test("content improvement uses a mocked response and preserves the original until acceptance", async () => {
  const data = portfolio();
  const before = structuredClone(data);
  const patch = await generateContentImprovement(data, summaryTarget, async () =>
    JSON.stringify({
      suggested: "Built a student-focused website and documented the supporting design decisions.",
      reason: "Improves clarity without adding a new outcome.",
    }),
  );

  assert.ok(patch);
  assert.equal(data.summary, summaryTarget.original);
  assert.deepEqual(data, before);
  assert.match(createContentImprovementPrompt(data, summaryTarget), /Do not invent|Do not add a number/);
});

test("accepting a valid patch changes only the selected draft field", () => {
  const data = portfolio();
  const patch = {
    ...summaryTarget,
    suggested: "Built a student-focused website and documented the supporting design decisions.",
    reason: "Improves clarity without adding facts.",
  };
  const result = applyContentImprovementPatch(data, patch);

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.summary, patch.suggested);
  assert.deepEqual(result.data.personal, data.personal);
  assert.deepEqual(result.data.projects, data.projects);
  assert.equal(data.summary, summaryTarget.original);
});

test("stale originals, missing items, invalid indices, and invalid AI output are rejected", async () => {
  const data = portfolio();
  assert.deepEqual(
    applyContentImprovementPatch(data, {
      ...summaryTarget,
      original: "An older summary.",
      suggested: "Replacement",
      reason: "Reason",
    }),
    { success: false, reason: "stale" },
  );
  assert.equal(
    readContentImprovementTarget(data, {
      section: "projects",
      itemId: "missing-project",
      field: "description",
      listIndex: null,
      original: "Some text",
    }),
    null,
  );
  assert.equal(
    readContentImprovementTarget(data, {
      section: "projects",
      itemId: "project-1",
      field: "highlight",
      listIndex: 99,
      original: "Some text",
    }),
    null,
  );
  assert.equal(await generateContentImprovement(data, summaryTarget, async () => "not-json"), null);
});

test("an empty field is never eligible for content generation", () => {
  assert.equal(
    ContentImprovementTargetSchema.safeParse({ ...summaryTarget, original: "" }).success,
    false,
  );
});

test("a generated suggestion cannot introduce a metric absent from the original", async () => {
  assert.equal(
    await generateContentImprovement(portfolio(), summaryTarget, async () =>
      JSON.stringify({
        suggested: "Built a website used by 5,000 students.",
        reason: "Adds impact.",
      }),
    ),
    null,
  );
});
