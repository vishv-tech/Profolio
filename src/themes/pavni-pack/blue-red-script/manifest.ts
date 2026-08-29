import { definePavniTheme } from "../types";

export const blueRedScriptManifest = definePavniTheme({
  layoutKey: "pavni-blue-red-script",
  name: "Blue Red Script",
  description: "A handwritten blue-and-red portfolio with tactile notes, a taped portrait, and lively editorial motion.",
  category: "Creative",
  careerTags: ["writer", "designer", "content creator"],
  styleTags: ["handwritten", "notebook", "collage", "blue and red"],
  component: () => import("./BlueRedScriptTheme"),
});
