import { defineCareerTheme } from "../types";

export const businessConsultingManifest = defineCareerTheme({
  layoutKey: "career-business-consulting",
  name: "Executive Advisory",
  description: "An executive strategy deck with growth signals, numbered case studies, and outcome-focused storytelling.",
  category: "Business",
  careerTags: ["management consultant", "business analyst", "strategy", "operations"],
  styleTags: ["executive deck", "growth signal", "strategy", "KPI rhythm"],
  component: () => import("./BusinessConsultingTheme"),
});
