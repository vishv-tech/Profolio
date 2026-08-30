import { defineCareerTheme } from "../types";

export const electricalEngineerManifest = defineCareerTheme({
  layoutKey: "career-electrical-engineer",
  name: "Circuit Brief",
  description: "A circuit-inspired signal board for systems work, technical projects, and field experience.",
  category: "Engineering",
  careerTags: ["electrical engineer", "electronics", "embedded systems", "power systems"],
  styleTags: ["circuit", "signal", "technical", "modular grid"],
  component: () => import("./ElectricalEngineerTheme"),
});
