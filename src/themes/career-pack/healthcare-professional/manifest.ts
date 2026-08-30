import { defineCareerTheme } from "../types";

export const healthcareProfessionalManifest = defineCareerTheme({
  layoutKey: "career-healthcare-professional",
  name: "Clinical Profile",
  description: "A calm clinical record prioritizing readability, education, credentials, and professional trust.",
  category: "Healthcare",
  careerTags: ["doctor", "nurse", "therapist", "healthcare"],
  styleTags: ["clinical", "trustworthy", "accessible", "credential-led"],
  component: () => import("./HealthcareProfessionalTheme"),
});
