import { defineCareerTheme } from "../types";

export const mechanicalEngineerManifest = defineCareerTheme({
  layoutKey: "career-mechanical-engineer",
  name: "Precision Mechanics",
  description: "A structured timeline starter for engineering practice and delivery.",
  category: "Engineering",
  careerTags: ["mechanical engineer", "manufacturing", "automotive", "product engineering"],
  styleTags: ["technical", "structured", "timeline"],
  component: () => import("./MechanicalEngineerTheme"),
});
