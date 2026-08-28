import { defineCareerTheme } from "../types";

export const electricalEngineerManifest = defineCareerTheme({
  layoutKey: "career-electrical-engineer",
  name: "Circuit Brief",
  description: "A modular grid starter for systems, projects, and technical depth.",
  category: "Engineering",
  careerTags: ["electrical engineer", "electronics", "embedded systems", "power systems"],
  styleTags: ["modular", "technical", "grid"],
  component: () => import("./ElectricalEngineerTheme"),
});
