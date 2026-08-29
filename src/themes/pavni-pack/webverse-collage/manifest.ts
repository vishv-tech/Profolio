import { definePavniTheme } from "../types";

export const webverseCollageManifest = definePavniTheme({
  layoutKey: "pavni-webverse-collage",
  name: "Webverse Collage",
  description: "A red-and-blue web-inspired collage that responds to the visitor.",
  category: "Experimental",
  careerTags: ["designer", "artist", "creator", "storyteller"],
  styleTags: ["collage", "interactive", "bold", "poster"],
  component: () => import("./WebverseCollageTheme"),
});
