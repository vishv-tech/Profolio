import { definePavniTheme } from "../types";

export const blackBlueStartupManifest = definePavniTheme({
  layoutKey: "pavni-black-blue-startup",
  name: "Black Blue Startup",
  description: "A confident dark portfolio with luminous blue presentation cards.",
  category: "Business",
  careerTags: ["founder", "operator", "product", "consultant"],
  styleTags: ["dark", "startup", "luminous", "bold"],
  component: () => import("./BlackBlueStartupTheme"),
});
