import { definePavniTheme } from "../types";

export const orbitSketchManifest = definePavniTheme({
  layoutKey: "pavni-orbit-sketch",
  name: "Orbit Sketch",
  description: "An illustrated blue-and-white portfolio with orbiting doodles and playful album-card motion.",
  category: "Creative",
  careerTags: ["illustrator", "designer", "creative professional"],
  styleTags: ["illustrated", "doodle", "album", "playful", "kinetic"],
  component: () => import("./OrbitSketchTheme"),
});
