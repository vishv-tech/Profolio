import { definePavniTheme } from "../types";

export const colorCutoutManifest = definePavniTheme({
  layoutKey: "pavni-color-cutout",
  name: "Color Cutout",
  description: "A bold yellow-and-blue scrapbook portfolio with playful paper typography.",
  category: "Creative",
  careerTags: ["designer", "artist", "content creator", "general portfolio"],
  styleTags: ["cutout", "collage", "bold", "colorful"],
  component: () => import("./ColorCutoutTheme"),
});
