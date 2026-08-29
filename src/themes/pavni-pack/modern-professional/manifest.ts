import { definePavniTheme } from "../types";

export const modernProfessionalManifest = definePavniTheme({
  layoutKey: "pavni-modern-professional",
  name: "Modern Professional",
  description: "A precise black-and-white portfolio with graphic contour detail.",
  category: "Professional",
  careerTags: ["executive", "consultant", "strategist", "professional"],
  styleTags: ["monochrome", "graphic", "modern", "high-contrast"],
  component: () => import("./ModernProfessionalTheme"),
});
