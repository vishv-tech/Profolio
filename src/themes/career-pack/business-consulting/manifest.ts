import { defineCareerTheme } from "../types";

export const businessConsultingManifest = defineCareerTheme({
  layoutKey: "career-business-consulting",
  name: "Executive Advisory",
  description: "A clear executive-summary starter for consulting and business roles.",
  category: "Business",
  careerTags: ["management consultant", "business analyst", "strategy", "operations"],
  styleTags: ["executive", "structured", "outcome-focused"],
  component: () => import("./BusinessConsultingTheme"),
});
