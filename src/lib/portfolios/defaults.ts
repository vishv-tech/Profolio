import type {
  AchievementItem,
  CertificationItem,
  CustomSection,
  CustomSectionItem,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  LinkItem,
  PortfolioData,
  ProjectItem,
  SkillGroup,
} from "@/types/portfolio";

export type PortfolioIdFactory = () => string;

const defaultIdFactory: PortfolioIdFactory = () => crypto.randomUUID();

export function createEmptyPortfolioData(): PortfolioData {
  return {
    personal: {
      fullName: "",
      headline: "",
      email: "",
      phone: "",
      location: "",
      profileImageUrl: "",
    },
    summary: "",
    experience: [],
    education: [],
    projects: [],
    skills: [],
    achievements: [],
    certifications: [],
    links: [],
    languages: [],
    interests: [],
    customSections: [],
  };
}

export function createEmptyExperience(
  createId: PortfolioIdFactory = defaultIdFactory,
): ExperienceItem {
  return {
    id: createId(), company: "", role: "", employmentType: "", location: "",
    startDate: "", endDate: "", isCurrent: false, description: "", highlights: [],
  };
}

export function createEmptyEducation(
  createId: PortfolioIdFactory = defaultIdFactory,
): EducationItem {
  return {
    id: createId(), institution: "", degree: "", fieldOfStudy: "", location: "",
    startDate: "", endDate: "", grade: "", description: "",
  };
}

export function createEmptyProject(
  createId: PortfolioIdFactory = defaultIdFactory,
): ProjectItem {
  return {
    id: createId(), name: "", description: "", technologies: [], highlights: [],
    projectUrl: "", githubUrl: "", startDate: "", endDate: "",
  };
}

export function createEmptySkillGroup(
  createId: PortfolioIdFactory = defaultIdFactory,
): SkillGroup {
  return { id: createId(), category: "", items: [] };
}

export function createEmptyAchievement(
  createId: PortfolioIdFactory = defaultIdFactory,
): AchievementItem {
  return { id: createId(), title: "", issuer: "", date: "", description: "" };
}

export function createEmptyCertification(
  createId: PortfolioIdFactory = defaultIdFactory,
): CertificationItem {
  return {
    id: createId(), name: "", issuer: "", issueDate: "", expiryDate: "",
    credentialId: "", credentialUrl: "",
  };
}

export function createEmptyLink(
  createId: PortfolioIdFactory = defaultIdFactory,
): LinkItem {
  return { id: createId(), type: "other", label: "", url: "" };
}

export function createEmptyLanguage(
  createId: PortfolioIdFactory = defaultIdFactory,
): LanguageItem {
  return { id: createId(), name: "", proficiency: "" };
}

export function createEmptyCustomSectionItem(
  createId: PortfolioIdFactory = defaultIdFactory,
): CustomSectionItem {
  return { id: createId(), title: "", subtitle: "", date: "", description: "" };
}

export function createEmptyCustomSection(
  createId: PortfolioIdFactory = defaultIdFactory,
): CustomSection {
  return { id: createId(), title: "", items: [] };
}
