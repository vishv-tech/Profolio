import { defineCareerTheme } from "../types";

export const contentCreatorManifest = defineCareerTheme({
  layoutKey: "career-content-creator",
  name: "Creator Spotlight",
  description: "An editorial, creator-first portfolio for visual work and collaborations.",
  category: "Creative",
  careerTags: ["content creator", "writer", "video producer", "social media"],
  styleTags: ["editorial", "creator-first", "project-forward", "media-kit"],
  component: () => import("./ContentCreatorTheme"),
});
