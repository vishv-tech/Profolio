import { definePavniTheme } from "../types";

export const brownRedScrapbookManifest = definePavniTheme({
  layoutKey: "pavni-brown-red-scrapbook",
  name: "Brown Red Scrapbook",
  description: "A tactile collage of warm paper, handwritten notes, and collected work.",
  category: "Creative",
  careerTags: ["artist", "writer", "designer", "creator"],
  styleTags: ["scrapbook", "warm", "tactile", "collage"],
  component: () => import("./BrownRedScrapbookTheme"),
});
