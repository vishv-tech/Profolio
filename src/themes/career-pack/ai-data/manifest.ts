import { defineCareerTheme } from "../types";

export const aiDataManifest = defineCareerTheme({
  layoutKey: "career-ai-data",
  name: "Signal & Data",
  description: "A dense modular starter for machine learning and data work.",
  category: "Technology",
  careerTags: ["machine learning engineer", "data scientist", "AI researcher", "data engineer"],
  styleTags: ["technical", "dense", "modular"],
  component: () => import("./AiDataTheme"),
});
