import { defineCareerTheme } from "../types";

export const legalProfessionalManifest = defineCareerTheme({
  layoutKey: "career-legal-professional",
  name: "Counsel Profile",
  description: "An authoritative monochrome legal brief with indexed case-file structure and refined editorial motion.",
  category: "Legal",
  careerTags: ["lawyer", "legal counsel", "advocate", "compliance"],
  styleTags: ["legal brief", "case file", "monochrome", "editorial"],
  component: () => import("./LegalProfessionalTheme"),
});
