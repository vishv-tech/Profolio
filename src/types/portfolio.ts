export interface PortfolioData {
  personal: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  skills: SkillGroup[];
  achievements: AchievementItem[];
  certifications: CertificationItem[];
  links: LinkItem[];
  languages: LanguageItem[];
  interests: string[];
  customSections: CustomSection[];
}

export interface PersonalInfo {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  profileImageUrl: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  employmentType: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  highlights: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  location: string;
  startDate: string;
  endDate: string;
  grade: string;
  description: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  highlights: string[];
  projectUrl: string;
  githubUrl: string;
  startDate: string;
  endDate: string;
}

export interface SkillGroup {
  id: string;
  category: string;
  items: string[];
}

export interface AchievementItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  credentialUrl: string;
}

export type LinkType =
  | "linkedin"
  | "github"
  | "portfolio"
  | "behance"
  | "dribbble"
  | "medium"
  | "youtube"
  | "other";

export interface LinkItem {
  id: string;
  type: LinkType;
  label: string;
  url: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  proficiency: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  description: string;
}
