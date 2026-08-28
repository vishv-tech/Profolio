import assert from "node:assert/strict";
import test from "node:test";

import { parseStoredPortfolio, toDatabaseJson } from "@/lib/resumes/json";
import type { PortfolioData } from "@/types/portfolio";

const EMPTY_PORTFOLIO: PortfolioData = {
  personal: {
    fullName: "Ada Lovelace",
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

test("round-trips validated PortfolioData through database JSON", () => {
  const json = toDatabaseJson(EMPTY_PORTFOLIO);

  assert.deepEqual(parseStoredPortfolio(json), EMPTY_PORTFOLIO);
});

test("rejects malformed stored data instead of trusting extracted_data", () => {
  assert.equal(parseStoredPortfolio({ personal: {} }), null);
  assert.equal(parseStoredPortfolio(null), null);
});

test("rejects undefined and non-finite values before database writes", () => {
  assert.throws(() => toDatabaseJson({ unsafe: undefined }), TypeError);
  assert.throws(() => toDatabaseJson(Number.NaN), TypeError);
});
