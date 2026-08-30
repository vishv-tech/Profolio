import { defineCareerTheme } from "../types";

export const mechanicalEngineerManifest = defineCareerTheme({
  layoutKey: "career-mechanical-engineer",
  name: "Precision Mechanics",
  description: "An industrial engineering dossier with animated gearwork, precision grids, and technical project sequencing.",
  category: "Engineering",
  careerTags: ["mechanical engineer", "manufacturing", "automotive", "product engineering"],
  styleTags: ["gearwork", "blueprint", "industrial", "technical dossier"],
  component: () => import("./MechanicalEngineerTheme"),
});
