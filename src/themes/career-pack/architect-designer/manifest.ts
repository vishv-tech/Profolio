import { defineCareerTheme } from "../types";

export const architectDesignerManifest = defineCareerTheme({
  layoutKey: "career-architect-designer",
  name: "Studio Folio",
  description: "An asymmetric project-led starter for spatial and visual designers.",
  category: "Design",
  careerTags: ["architect", "interior designer", "urban designer", "spatial designer"],
  styleTags: ["asymmetric", "portfolio", "project-forward"],
  component: () => import("./ArchitectDesignerTheme"),
});
