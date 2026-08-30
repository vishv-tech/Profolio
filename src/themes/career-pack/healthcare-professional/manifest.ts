import { defineCareerTheme } from "../types";

export const healthcareProfessionalManifest = defineCareerTheme({
  layoutKey: "career-healthcare-professional",
  name: "Clinical Profile",
  description: "A calm clinical record with a responsive heartbeat motif, clear credentials, and reassuring readability.",
  category: "Healthcare",
  careerTags: ["doctor", "nurse", "therapist", "healthcare"],
  styleTags: ["clinical", "heartbeat", "trusted", "credential-led"],
  component: () => import("./HealthcareProfessionalTheme"),
});
