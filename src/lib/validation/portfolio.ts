import { z } from "zod";

import type {
  AchievementItem,
  CertificationItem,
  CustomSection,
  CustomSectionItem,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  LinkItem,
  PersonalInfo,
  PortfolioData,
  ProjectItem,
  SkillGroup,
} from "@/types/portfolio";

export const PersonalInfoSchema: z.ZodType<PersonalInfo> = z.strictObject({
  fullName: z.string(),
  headline: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  profileImageUrl: z.string(),
});

export const ExperienceItemSchema: z.ZodType<ExperienceItem> = z.strictObject({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  employmentType: z.string(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  isCurrent: z.boolean(),
  description: z.string(),
  highlights: z.array(z.string()),
});

export const EducationItemSchema: z.ZodType<EducationItem> = z.strictObject({
  id: z.string(),
  institution: z.string(),
  degree: z.string(),
  fieldOfStudy: z.string(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  grade: z.string(),
  description: z.string(),
});

export const ProjectItemSchema: z.ZodType<ProjectItem> = z.strictObject({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
  highlights: z.array(z.string()),
  projectUrl: z.string(),
  githubUrl: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

export const SkillGroupSchema: z.ZodType<SkillGroup> = z.strictObject({
  id: z.string(),
  category: z.string(),
  items: z.array(z.string()),
});

export const AchievementItemSchema: z.ZodType<AchievementItem> =
  z.strictObject({
    id: z.string(),
    title: z.string(),
    issuer: z.string(),
    date: z.string(),
    description: z.string(),
  });

export const CertificationItemSchema: z.ZodType<CertificationItem> =
  z.strictObject({
    id: z.string(),
    name: z.string(),
    issuer: z.string(),
    issueDate: z.string(),
    expiryDate: z.string(),
    credentialId: z.string(),
    credentialUrl: z.string(),
  });

export const LinkItemSchema: z.ZodType<LinkItem> = z.strictObject({
  id: z.string(),
  type: z.enum([
    "linkedin",
    "github",
    "portfolio",
    "behance",
    "dribbble",
    "medium",
    "youtube",
    "other",
  ]),
  label: z.string(),
  url: z.string(),
});

export const LanguageItemSchema: z.ZodType<LanguageItem> = z.strictObject({
  id: z.string(),
  name: z.string(),
  proficiency: z.string(),
});

export const CustomSectionItemSchema: z.ZodType<CustomSectionItem> =
  z.strictObject({
    id: z.string(),
    title: z.string(),
    subtitle: z.string(),
    date: z.string(),
    description: z.string(),
  });

export const CustomSectionSchema: z.ZodType<CustomSection> = z.strictObject({
  id: z.string(),
  title: z.string(),
  items: z.array(CustomSectionItemSchema),
});

export const PortfolioDataSchema: z.ZodType<PortfolioData> = z.strictObject({
  personal: PersonalInfoSchema,
  summary: z.string(),
  experience: z.array(ExperienceItemSchema),
  education: z.array(EducationItemSchema),
  projects: z.array(ProjectItemSchema),
  skills: z.array(SkillGroupSchema),
  achievements: z.array(AchievementItemSchema),
  certifications: z.array(CertificationItemSchema),
  links: z.array(LinkItemSchema),
  languages: z.array(LanguageItemSchema),
  interests: z.array(z.string()),
  customSections: z.array(CustomSectionSchema),
});
