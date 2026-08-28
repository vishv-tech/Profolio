import assert from "node:assert/strict";
import test from "node:test";

import { validatePortfolioPublication } from "@/lib/portfolios/validation";
import type { PortfolioData } from "@/types/portfolio";
import type { ThemeConfig } from "@/types/theme";

const portfolio: PortfolioData = {
  personal: {
    fullName: "Vishv Lange",
    headline: "Engineer",
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

const themeConfig: ThemeConfig = {
  appearance: {
    colorMode: "light",
    backgroundColor: "#ffffff",
    surfaceColor: "#ffffff",
    textColor: "#111111",
    mutedTextColor: "#666666",
    accentColor: "#2563eb",
    borderColor: "#dddddd",
    fontFamily: "Geist",
    headingFontFamily: "Geist",
    borderRadius: 8,
    spacing: "comfortable",
    animationIntensity: "subtle",
  },
  sections: {
    order: ["summary", "experience", "education", "projects", "skills"],
    hidden: [],
  },
  visibility: {
    showProfileImage: true,
    showEmail: true,
    showPhone: true,
    showLocation: true,
    showLinks: true,
  },
};

test("rejects publication when draft content is not PortfolioData", () => {
  assert.deepEqual(
    validatePortfolioPublication({}, crypto.randomUUID(), themeConfig),
    { success: false, reason: "invalid-content" },
  );
});

test("rejects publication until both a theme and valid ThemeConfig exist", () => {
  assert.deepEqual(validatePortfolioPublication(portfolio, null, themeConfig), {
    success: false,
    reason: "theme-required",
  });
  assert.deepEqual(
    validatePortfolioPublication(portfolio, crypto.randomUUID(), {}),
    { success: false, reason: "theme-required" },
  );
});

test("returns the validated snapshots used by the publish transaction", () => {
  const themeId = crypto.randomUUID();
  const result = validatePortfolioPublication(portfolio, themeId, themeConfig);

  assert.equal(result.success, true);
  if (result.success) {
    assert.deepEqual(result.data.draftContent, portfolio);
    assert.deepEqual(result.data.themeConfig, themeConfig);
    assert.equal(result.data.themeId, themeId);
  }
});
