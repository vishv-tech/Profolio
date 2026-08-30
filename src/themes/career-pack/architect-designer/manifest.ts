import { defineCareerTheme } from "../types";

export const architectDesignerManifest = defineCareerTheme({
  layoutKey: "career-architect-designer",
  name: "Studio Folio",
  description: "A spatial studio folio with animated drafting layers, blueprint rhythm, and asymmetric project blocks.",
  category: "Design",
  careerTags: ["architect", "interior designer", "urban designer", "spatial designer"],
  styleTags: ["floorplan", "drafting", "blueprint grid", "asymmetric"],
  component: () => import("./ArchitectDesignerTheme"),
});
