import { definePavniTheme } from "../types";

export const dynamicBentoManifest = definePavniTheme({
  layoutKey: "pavni-dynamic-bento",
  name: "Dynamic Bento",
  description: "A playful modular portfolio built from energetic, spacious cards.",
  category: "Creative",
  careerTags: ["designer", "product", "creative", "generalist"],
  styleTags: ["bento", "colorful", "modular", "playful"],
  component: () => import("./DynamicBentoTheme"),
});
