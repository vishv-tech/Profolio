import { definePavniTheme } from "../types";

export const stripedNotesManifest = definePavniTheme({
  layoutKey: "pavni-striped-notes",
  name: "Striped Notes",
  description: "A playful blue-and-beige portfolio with hand-drawn notes and scrapbook energy.",
  category: "Creative",
  careerTags: ["writer", "designer", "content creator", "general portfolio"],
  styleTags: ["handwritten", "scrapbook", "striped", "playful"],
  component: () => import("./StripedNotesTheme"),
});
