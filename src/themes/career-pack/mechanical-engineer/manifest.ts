import { defineCareerTheme } from "../types";

export const mechanicalEngineerManifest = defineCareerTheme({
  layoutKey: "career-mechanical-engineer",
  name: "Precision Mechanics",
  description: "A blueprint-inspired engineering dossier with specification grids and precise project sequencing.",
  category: "Engineering",
  careerTags: ["mechanical engineer", "manufacturing", "automotive", "product engineering"],
  styleTags: ["blueprint", "technical", "specification", "structured"],
  component: () => import("./MechanicalEngineerTheme"),
});
