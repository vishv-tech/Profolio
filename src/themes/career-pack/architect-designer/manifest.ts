import { defineCareerTheme } from "../types";

export const architectDesignerManifest = defineCareerTheme({
  layoutKey: "career-architect-designer",
  name: "Studio Folio",
  description: "A spatial studio folio with blueprint rhythm, asymmetric project blocks, and editorial scale.",
  category: "Design",
  careerTags: ["architect", "interior designer", "urban designer", "spatial designer"],
  styleTags: ["spatial", "blueprint grid", "asymmetric", "project-forward"],
  component: () => import("./ArchitectDesignerTheme"),
});
