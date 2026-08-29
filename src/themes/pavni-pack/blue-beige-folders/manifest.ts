import { definePavniTheme } from "../types";

export const blueBeigeFoldersManifest = definePavniTheme({
  layoutKey: "pavni-blue-beige-folders",
  name: "Blue Beige Folders",
  description: "A calm portfolio organized as a tactile folder archive.",
  category: "Design",
  careerTags: ["designer", "researcher", "strategist", "general portfolio"],
  styleTags: ["folders", "tactile", "calm", "editorial"],
  component: () => import("./BlueBeigeFoldersTheme"),
});
