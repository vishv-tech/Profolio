import assert from "node:assert/strict";
import test from "node:test";

import { scorePortfolio } from "./score";
import type { PortfolioData } from "@/types/portfolio";

function emptyPortfolio(): PortfolioData {
  return {
    personal: {
      fullName: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      profileImageUrl: "",
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

function strongStudentPortfolio(): PortfolioData {
  return {
    ...emptyPortfolio(),
    personal: {
      fullName: "Riya Shah",
      headline: "Computer science student and frontend developer",
      email: "riya@example.com",
      phone: "+91 90000 00000",
      location: "Pune, India",
      profileImageUrl: "https://example.com/riya.jpg",
    },
    summary:
      "Computer science student focused on accessible web products, collaborative delivery, and thoughtful frontend engineering through academic and independent projects.",
    education: [
      {
        id: "education-1",
        institution: "Example Institute of Technology",
        degree: "Bachelor of Technology",
        fieldOfStudy: "Computer Science",
        location: "Pune",
        startDate: "2023",
        endDate: "2027",
        grade: "8.9 CGPA",
        description:
          "Coursework includes data structures, web engineering, databases, and human computer interaction with practical team assignments.",
      },
    ],
    projects: [
      {
        id: "project-1",
        name: "Campus accessibility map",
        description:
          "Designed and built an accessible campus navigation interface that documents routes and helps students compare available facilities.",
        technologies: ["TypeScript", "React", "Supabase"],
        highlights: [
          "Interviewed student volunteers and translated recurring navigation problems into tested interface improvements.",
        ],
        projectUrl: "https://example.com/access-map",
        githubUrl: "https://github.com/riya/access-map",
        startDate: "2025-01",
        endDate: "2025-04",
      },
      {
        id: "project-2",
        name: "Study planner",
        description:
          "Created a privacy-conscious study planner with reusable scheduling views and clear keyboard navigation for common tasks.",
        technologies: ["Next.js", "TypeScript", "CSS"],
        highlights: [
          "Documented usability findings and refined the interaction model based on real peer feedback.",
        ],
        projectUrl: "https://example.com/study-planner",
        githubUrl: "https://github.com/riya/study-planner",
        startDate: "2025-06",
        endDate: "2025-08",
      },
    ],
    skills: [
      { id: "skills-1", category: "Frontend", items: ["React", "Next.js", "TypeScript", "CSS"] },
      { id: "skills-2", category: "Product", items: ["Accessibility", "User research", "Prototyping", "Testing"] },
      { id: "skills-3", category: "Data", items: ["PostgreSQL", "Supabase", "SQL", "Data modeling"] },
    ],
    achievements: [
      {
        id: "achievement-1",
        title: "University project showcase finalist",
        issuer: "Example Institute of Technology",
        date: "2025",
        description: "Selected to present the campus accessibility map during the annual student project showcase.",
      },
    ],
    links: [
      { id: "link-1", type: "linkedin", label: "LinkedIn", url: "https://linkedin.com/in/riya" },
      { id: "link-2", type: "github", label: "GitHub", url: "https://github.com/riya" },
      { id: "link-3", type: "portfolio", label: "Portfolio", url: "https://riya.example.com" },
    ],
  };
}

test("an empty portfolio receives a bounded low score without crashing", () => {
  const result = scorePortfolio(emptyPortfolio());

  assert.ok(result.score >= 0 && result.score <= 39);
  assert.equal(result.rating, "Incomplete");
  assert.equal(result.categories.reduce((sum, category) => sum + category.maximum, 0), 100);
});

test("a complete student portfolio can be strong without employment", () => {
  const result = scorePortfolio(strongStudentPortfolio());

  assert.equal(strongStudentPortfolio().experience.length, 0);
  assert.ok(result.score >= 75, `expected at least 75, received ${result.score}`);
  assert.ok(result.categories.find(({ id }) => id === "career")!.score >= 14);
});

test("adding a well-described project improves only relevant aggregate quality", () => {
  const before = emptyPortfolio();
  const after: PortfolioData = {
    ...before,
    projects: [strongStudentPortfolio().projects[0]],
  };

  const beforeScore = scorePortfolio(before);
  const afterScore = scorePortfolio(after);

  assert.ok(afterScore.score > beforeScore.score);
  assert.ok(
    afterScore.categories.find(({ id }) => id === "projects")!.score >
      beforeScore.categories.find(({ id }) => id === "projects")!.score,
  );
});

test("adding a professional link improves proof and links", () => {
  const before = emptyPortfolio();
  const after: PortfolioData = {
    ...before,
    links: [strongStudentPortfolio().links[0]],
  };

  assert.ok(
    scorePortfolio(after).categories.find(({ id }) => id === "proof")!.score >
      scorePortfolio(before).categories.find(({ id }) => id === "proof")!.score,
  );
});

test("scores and category points always remain within their limits", () => {
  for (const portfolio of [emptyPortfolio(), strongStudentPortfolio()]) {
    const result = scorePortfolio(portfolio);
    assert.ok(result.score >= 0 && result.score <= 100);
    for (const category of result.categories) {
      assert.ok(category.score >= 0 && category.score <= category.maximum);
    }
  }
});

test("scoring and suggestions are deterministic and do not encourage fabrication", () => {
  const portfolio = emptyPortfolio();
  const first = scorePortfolio(portfolio);
  const second = scorePortfolio(structuredClone(portfolio));

  assert.deepEqual(first, second);
  const advice = first.suggestions.map(({ message }) => message).join(" ");
  assert.match(advice, /actually completed|if you have|only when they are factual/);
  assert.doesNotMatch(advice, /invent|fabricate a|must have a certification/i);
});

test("duplicated filler is not rewarded as high-quality content", () => {
  const repeated = "Worked on projects worked on projects worked on projects worked on projects.";
  const portfolio: PortfolioData = {
    ...emptyPortfolio(),
    summary: repeated,
    projects: [
      {
        ...strongStudentPortfolio().projects[0],
        description: repeated,
        highlights: [repeated],
      },
    ],
  };

  assert.ok(scorePortfolio(portfolio).categories.find(({ id }) => id === "content")!.score < 6);
});
