import { definePavniTheme } from "../types";

export const kineticGalleryManifest = definePavniTheme({
  layoutKey: "pavni-kinetic-gallery",
  name: "Kinetic Gallery",
  description: "A colorful exhibition space with a responsive lens and sculptural motion.",
  category: "Creative",
  careerTags: ["artist", "designer", "creative technologist", "content creator"],
  styleTags: ["kinetic", "gallery", "colorful", "experimental"],
  component: () => import("./KineticGalleryTheme"),
});
