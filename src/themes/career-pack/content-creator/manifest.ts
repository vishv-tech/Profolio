import { defineCareerTheme } from "../types";

export const contentCreatorManifest = defineCareerTheme({
  layoutKey: "career-content-creator",
  name: "Creator Spotlight",
  description: "A project-forward starter for creators and audience-led work.",
  category: "Creative",
  careerTags: ["content creator", "writer", "video producer", "social media"],
  styleTags: ["editorial", "project-forward", "approachable"],
  component: () => import("./ContentCreatorTheme"),
});
