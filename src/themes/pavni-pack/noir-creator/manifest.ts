import { definePavniTheme } from "../types";

export const noirCreatorManifest = definePavniTheme({
  layoutKey: "pavni-noir-creator",
  name: "Noir Creator",
  description: "A cinematic black-and-white portfolio with fine line art, dramatic type, and a portrait-led opening.",
  category: "Creative",
  careerTags: ["content creator", "photographer", "designer"],
  styleTags: ["noir", "cinematic", "monochrome", "portrait led"],
  component: () => import("./NoirCreatorTheme"),
});
