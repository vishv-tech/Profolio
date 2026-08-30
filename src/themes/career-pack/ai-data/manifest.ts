import { defineCareerTheme } from "../types";

export const aiDataManifest = defineCareerTheme({
  layoutKey: "career-ai-data",
  name: "Signal & Data",
  description: "A terminal-led data workspace for models, experiments, technical work, and measurable outcomes.",
  category: "Technology",
  careerTags: ["machine learning engineer", "data scientist", "AI researcher", "data engineer"],
  styleTags: ["terminal", "dashboard", "data grid", "technical"],
  component: () => import("./AiDataTheme"),
});
