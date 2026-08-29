import { definePavniTheme } from "../types";

export const professionalEditorialManifest = definePavniTheme({
  layoutKey: "pavni-professional-editorial",
  name: "Professional Editorial",
  description: "A calm monochrome editorial portfolio with a name-led introduction.",
  category: "Professional",
  careerTags: ["consultant", "writer", "manager", "professional"],
  styleTags: ["editorial", "monochrome", "minimal", "typographic"],
  component: () => import("./ProfessionalEditorialTheme"),
});
