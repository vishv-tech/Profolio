import { defineCareerTheme } from "../types";

export const healthcareProfessionalManifest = defineCareerTheme({
  layoutKey: "career-healthcare-professional",
  name: "Clinical Profile",
  description: "A calm, accessible starter for clinical and care-focused work.",
  category: "Healthcare",
  careerTags: ["doctor", "nurse", "therapist", "healthcare"],
  styleTags: ["calm", "accessible", "clear"],
  component: () => import("./HealthcareProfessionalTheme"),
});
