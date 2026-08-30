import { defineCareerTheme } from "../types";

export const productDesignerManifest = defineCareerTheme({
  layoutKey: "career-product-designer",
  name: "Product Casebook",
  description: "An interactive product casebook with prototype boards, component layers, and process-led storytelling.",
  category: "Design",
  careerTags: ["product designer", "UX designer", "UI designer", "design researcher"],
  styleTags: ["prototype board", "case study", "product thinking", "UI system"],
  component: () => import("./ProductDesignerTheme"),
});
