import { defineCareerTheme } from "../types";

export const businessConsultingManifest = defineCareerTheme({
  layoutKey: "career-business-consulting",
  name: "Executive Advisory",
  description: "An executive presentation-style portfolio for strategy, case studies, and business storytelling.",
  category: "Business",
  careerTags: ["management consultant", "business analyst", "strategy", "operations"],
  styleTags: ["executive deck", "strategy", "case study", "outcome-focused"],
  component: () => import("./BusinessConsultingTheme"),
});
