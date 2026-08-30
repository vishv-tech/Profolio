import { PortfolioDataSchema } from "@/lib/validation/portfolio";
import type { GeminiResumeExtraction } from "@/lib/ai/resume-schema";
import {
  deduplicateResumeSourceLinks,
  normalizeExternalUrl,
} from "@/lib/resumes/links";
import type { PortfolioData } from "@/types/portfolio";

type IdFactory = () => string;

type NormalizeResumeOptions = {
  createId?: IdFactory;
};

function cleanText(value: string) {
  return value.trim();
}

function cleanList(values: string[]) {
  return values.map(cleanText).filter(Boolean);
}

function cleanExternalUrl(value: string) {
  return normalizeExternalUrl(value) ?? "";
}

export function buildPortfolioFromResumeExtraction(
  extraction: GeminiResumeExtraction,
  { createId = () => crypto.randomUUID() }: NormalizeResumeOptions = {},
): PortfolioData {
  return {
    personal: {
      fullName: cleanText(extraction.personal.fullName),
      headline: cleanText(extraction.personal.headline),
      email: cleanText(extraction.personal.email),
      phone: cleanText(extraction.personal.phone),
      location: cleanText(extraction.personal.location),
      profileImageUrl: "",
    },
    summary: cleanText(extraction.summary),
    experience: extraction.experience.map((item) => ({
      id: createId(),
      company: cleanText(item.company),
      role: cleanText(item.role),
      employmentType: cleanText(item.employmentType),
      location: cleanText(item.location),
      startDate: cleanText(item.startDate),
      endDate: item.isCurrent ? "" : cleanText(item.endDate),
      isCurrent: item.isCurrent,
      description: cleanText(item.description),
      highlights: cleanList(item.highlights),
    })),
    education: extraction.education.map((item) => ({
      id: createId(),
      institution: cleanText(item.institution),
      degree: cleanText(item.degree),
      fieldOfStudy: cleanText(item.fieldOfStudy),
      location: cleanText(item.location),
      startDate: cleanText(item.startDate),
      endDate: cleanText(item.endDate),
      grade: cleanText(item.grade),
      description: cleanText(item.description),
    })),
    projects: extraction.projects.map((item) => ({
      id: createId(),
      name: cleanText(item.name),
      description: cleanText(item.description),
      technologies: cleanList(item.technologies),
      highlights: cleanList(item.highlights),
      projectUrl: cleanExternalUrl(item.projectUrl),
      githubUrl: cleanExternalUrl(item.githubUrl),
      startDate: cleanText(item.startDate),
      endDate: cleanText(item.endDate),
    })),
    skills: extraction.skills.map((group) => ({
      id: createId(),
      category: cleanText(group.category),
      items: cleanList(group.items),
    })),
    achievements: extraction.achievements.map((item) => ({
      id: createId(),
      title: cleanText(item.title),
      issuer: cleanText(item.issuer),
      date: cleanText(item.date),
      description: cleanText(item.description),
    })),
    certifications: extraction.certifications.map((item) => ({
      id: createId(),
      name: cleanText(item.name),
      issuer: cleanText(item.issuer),
      issueDate: cleanText(item.issueDate),
      expiryDate: cleanText(item.expiryDate),
      credentialId: cleanText(item.credentialId),
      credentialUrl: cleanExternalUrl(item.credentialUrl),
    })),
    links: deduplicateResumeSourceLinks(extraction.links).map((link) => ({
      id: createId(),
      ...link,
    })),
    languages: extraction.languages.map((item) => ({
      id: createId(),
      name: cleanText(item.name),
      proficiency: cleanText(item.proficiency),
    })),
    interests: cleanList(extraction.interests),
    customSections: extraction.customSections.map((section) => ({
      id: createId(),
      title: cleanText(section.title),
      items: section.items.map((item) => ({
        id: createId(),
        title: cleanText(item.title),
        subtitle: cleanText(item.subtitle),
        date: cleanText(item.date),
        description: cleanText(item.description),
      })),
    })),
  };
}

export function normalizeResumeExtraction(
  extraction: GeminiResumeExtraction,
  options: NormalizeResumeOptions = {},
) {
  return PortfolioDataSchema.parse(
    buildPortfolioFromResumeExtraction(extraction, options),
  );
}
