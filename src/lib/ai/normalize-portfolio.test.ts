import assert from "node:assert/strict";
import test from "node:test";

import { normalizeResumeExtraction } from "@/lib/ai/normalize-portfolio";
import {
  GeminiResumeExtractionSchema,
  parseGeminiResumeExtraction,
  type GeminiResumeExtraction,
} from "@/lib/ai/resume-schema";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";

function sparseExtraction(): GeminiResumeExtraction {
  return {
    personal: {
      fullName: "  Avery Student  ",
      headline: "",
      email: "avery@example.com",
      phone: "",
      location: "",
    },
    summary: "",
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
}

test("normalizes sparse resumes into the frozen PortfolioData contract", () => {
  const portfolio = normalizeResumeExtraction(sparseExtraction());

  assert.equal(portfolio.personal.fullName, "Avery Student");
  assert.equal(portfolio.personal.profileImageUrl, "");
  assert.deepEqual(portfolio.experience, []);
  assert.equal(PortfolioDataSchema.safeParse(portfolio).success, true);
});

test("generates unique stable IDs for every repeatable application item", () => {
  const extraction = sparseExtraction();
  extraction.experience = [
    {
      company: "One Corp",
      role: "Developer",
      employmentType: "Full-time",
      location: "Remote",
      startDate: "2024-01",
      endDate: "Present",
      isCurrent: true,
      description: "Built products.",
      highlights: ["Shipped features"],
    },
    {
      company: "Two Corp",
      role: "Intern",
      employmentType: "Internship",
      location: "Pune",
      startDate: "2023",
      endDate: "2023",
      isCurrent: false,
      description: "Supported the team.",
      highlights: [],
    },
  ];
  extraction.projects = [
    {
      name: "Portfolio",
      description: "Built a site.",
      technologies: ["React"],
      highlights: [],
      projectUrl: "",
      githubUrl: "https://github.com/avery/portfolio",
      startDate: "2024",
      endDate: "2024",
    },
  ];
  extraction.customSections = [
    {
      title: "Volunteering",
      items: [
        {
          title: "Mentor",
          subtitle: "Code Club",
          date: "2024",
          description: "Mentored students.",
        },
      ],
    },
  ];

  const portfolio = normalizeResumeExtraction(extraction);
  const ids = [
    ...portfolio.experience.map(({ id }) => id),
    ...portfolio.projects.map(({ id }) => id),
    ...portfolio.customSections.flatMap((section) => [
      section.id,
      ...section.items.map(({ id }) => id),
    ]),
  ];

  assert.equal(new Set(ids).size, ids.length);
  ids.forEach((id) => assert.match(id, /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i));
  assert.equal(portfolio.experience[0].endDate, "");
});

test("normalization preserves source facts without adding unsupported claims", () => {
  const extraction = sparseExtraction();
  extraction.projects = [
    {
      name: "React Website",
      description: "Built a React website.",
      technologies: ["React"],
      highlights: [],
      projectUrl: "",
      githubUrl: "",
      startDate: "",
      endDate: "",
    },
  ];

  const serialized = JSON.stringify(normalizeResumeExtraction(extraction));

  assert.match(serialized, /Built a React website\./);
  assert.doesNotMatch(
    serialized,
    /40% faster|10,000 users|increased revenue|led a team/i,
  );
});

test("infers common link types without changing link content", () => {
  const extraction = sparseExtraction();
  extraction.links = [
    {
      type: "other",
      label: "Code",
      url: "https://github.com/avery",
    },
  ];

  const portfolio = normalizeResumeExtraction(extraction);

  assert.equal(portfolio.links[0].type, "github");
  assert.equal(portfolio.links[0].url, "https://github.com/avery");
});

test("strict extraction rejects Gemini-generated application IDs", () => {
  const invalid = {
    ...sparseExtraction(),
    experience: [
      {
        id: "model-invented-id",
        company: "Example",
        role: "Developer",
        employmentType: "",
        location: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        description: "",
        highlights: [],
      },
    ],
  };

  assert.equal(GeminiResumeExtractionSchema.safeParse(invalid).success, false);
  assert.deepEqual(parseGeminiResumeExtraction("```json\n{}\n```"), {
    success: false,
  });
});
