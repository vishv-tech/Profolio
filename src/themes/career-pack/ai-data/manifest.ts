import { defineCareerTheme } from "../types";

export const aiDataManifest = defineCareerTheme({
  layoutKey: "career-ai-data",
  name: "Signal & Data",
  description: "A futuristic data workspace with neural connections, streaming signals, and layered technical evidence.",
  category: "Technology",
  careerTags: ["machine learning engineer", "data scientist", "AI researcher", "data engineer"],
  styleTags: ["neural network", "data stream", "terminal", "futuristic"],
  component: () => import("./AiDataTheme"),
});
