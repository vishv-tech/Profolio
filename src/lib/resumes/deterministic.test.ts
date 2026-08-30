import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDeterministicPortfolio,
  isDeterministicPortfolioUsable,
  isResumeTextUsable,
} from "@/lib/resumes/deterministic";
import { runSafeDeterministicPipeline } from "@/lib/resumes/deterministic-pipeline";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";

const COMPLETE_RESUME = `
Jordan Patel
jordan.patel@example.dev | +91 98765 43210
Location: Pune, India
https://github.com/jordan-patel

PROFESSIONAL SUMMARY
Software developer focused on reliable, accessible products and careful testing.

WORK EXPERIENCE
Role: Software Engineer
Company: Example Labs
Employment Type: Full-time
Location: Pune, India
Dates: January 2023 - Present
Description: Built and maintained internal web tools.
- Reduced manual review work through validated automation.

ACADEMIC QUALIFICATIONS
Institution: Example Institute of Technology
Degree: Bachelor of Technology
Field of Study: Computer Science
Dates: 2019 - 2023
Grade: 8.7 CGPA

PERSONAL PROJECTS
Project: Campus Planner
Description: A scheduling tool for student teams.
Technologies: TypeScript, React, PostgreSQL
GitHub: https://github.com/jordan-patel/campus-planner
- Added accessible keyboard navigation.

TECHNICAL SKILLS
Languages: TypeScript, JavaScript, SQL
Tools: React, Node.js, Git

AWARDS
Award: University Hackathon Winner
Issuer: Example Institute
Date: 2022

CERTIFICATES
Name: Cloud Fundamentals
Issuer: Example Learning
Issue Date: 2023

LANGUAGES
English - Fluent, Hindi - Native

HOBBIES
Cycling, Photography
`;

function createSequentialId() {
  let value = 0;
  return () => `generated-${++value}`;
}

test("builds conservative canonical PortfolioData from explicit resume sections", () => {
  const portfolio = buildDeterministicPortfolio(
    COMPLETE_RESUME,
    createSequentialId(),
  );

  assert.equal(PortfolioDataSchema.safeParse(portfolio).success, true);
  assert.deepEqual(portfolio.personal, {
    email: "jordan.patel@example.dev",
    fullName: "Jordan Patel",
    headline: "",
    location: "Pune, India",
    phone: "+91 98765 43210",
    profileImageUrl: "",
  });
  assert.match(portfolio.summary, /reliable, accessible products/u);
  assert.deepEqual(
    portfolio.experience.map(({ company, endDate, isCurrent, role, startDate }) => ({
      company,
      endDate,
      isCurrent,
      role,
      startDate,
    })),
    [
      {
        company: "Example Labs",
        endDate: "",
        isCurrent: true,
        role: "Software Engineer",
        startDate: "January 2023",
      },
    ],
  );
  assert.equal(portfolio.education[0].institution, "Example Institute of Technology");
  assert.equal(portfolio.projects[0].name, "Campus Planner");
  assert.deepEqual(portfolio.projects[0].technologies, [
    "TypeScript",
    "React",
    "PostgreSQL",
  ]);
  assert.equal(portfolio.skills.length, 2);
  assert.equal(portfolio.achievements[0].title, "University Hackathon Winner");
  assert.equal(portfolio.certifications[0].name, "Cloud Fundamentals");
  assert.deepEqual(
    portfolio.languages.map(({ name, proficiency }) => ({ name, proficiency })),
    [
      { name: "English", proficiency: "Fluent" },
      { name: "Hindi", proficiency: "Native" },
    ],
  );
  assert.deepEqual(portfolio.interests, ["Cycling", "Photography"]);
  assert.equal(portfolio.links.some((link) => link.type === "github"), true);
  const repeatableItems = [
    ...portfolio.experience,
    ...portfolio.education,
    ...portfolio.projects,
    ...portfolio.skills,
    ...portfolio.achievements,
    ...portfolio.certifications,
    ...portfolio.links,
    ...portfolio.languages,
  ];
  const ids = repeatableItems.map((item) => item.id);

  assert.equal(new Set(ids).size, repeatableItems.length);
  assert.equal(ids.every((id) => id.startsWith("generated-")), true);
});

test("leaves unknown fields empty instead of inferring career facts", () => {
  const portfolio = buildDeterministicPortfolio(`
    Avery Student
    avery@example.dev
    SUMMARY
    Curious builder who documents work carefully and validates every result.
  `);

  assert.equal(portfolio.personal.headline, "");
  assert.equal(portfolio.personal.location, "");
  assert.equal(portfolio.personal.phone, "");
  assert.deepEqual(portfolio.experience, []);
  assert.deepEqual(portfolio.education, []);
  assert.deepEqual(portfolio.projects, []);
  assert.deepEqual(portfolio.certifications, []);
  assert.equal(isDeterministicPortfolioUsable(portfolio), true);
});

test("requires readable page density and enough lines", () => {
  assert.equal(isResumeTextUsable(COMPLETE_RESUME, 2), true);
  assert.equal(isResumeTextUsable("ten chars", 1), false);
  assert.equal(
    isResumeTextUsable(
      "Avery Student\nSummary\n" + "reliable content ".repeat(15),
      20,
    ),
    false,
  );
});

test("safe deterministic pipeline resolves failures without throwing", async () => {
  const parseFailure = await runSafeDeterministicPipeline(new Uint8Array(), {
    parsePdf: async () => {
      throw new Error("synthetic parser failure");
    },
  });
  const unusableText = await runSafeDeterministicPipeline(new Uint8Array(), {
    parsePdf: async () => ({
      diagnostics: {
        pageFailures: 0,
        textPageFailures: 0,
      },
      pageCount: 1,
      text: "tiny",
    }),
  });

  assert.deepEqual(parseFailure, {
    success: false,
    source: "deterministic",
    reason: "pdf-parse",
  });
  assert.deepEqual(unusableText, {
    success: false,
    source: "deterministic",
    reason: "unusable-text",
  });
});
