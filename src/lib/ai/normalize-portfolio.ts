import { PortfolioDataSchema } from "@/lib/validation/portfolio";
import type { GeminiResumeExtraction } from "@/lib/ai/resume-schema";
import type { LinkType, PortfolioData } from "@/types/portfolio";

type IdFactory = () => string;

function cleanText(value: string) {
  return value.trim();
}

function cleanList(values: string[]) {
  return values.map(cleanText).filter(Boolean);
}

function hostnameForLink(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(
      /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`,
    );

    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function normalizeLinkType(type: LinkType, url: string): LinkType {
  const hostname = hostnameForLink(url);

  if (hostname === "linkedin.com" || hostname.endsWith(".linkedin.com")) {
    return "linkedin";
  }

  if (hostname === "github.com" || hostname.endsWith(".github.com")) {
    return "github";
  }

  if (hostname === "behance.net" || hostname.endsWith(".behance.net")) {
    return "behance";
  }

  if (hostname === "dribbble.com" || hostname.endsWith(".dribbble.com")) {
    return "dribbble";
  }

  if (hostname === "medium.com" || hostname.endsWith(".medium.com")) {
    return "medium";
  }

  if (
    hostname === "youtube.com" ||
    hostname.endsWith(".youtube.com") ||
    hostname === "youtu.be"
  ) {
    return "youtube";
  }

  return type;
}

export function normalizeResumeExtraction(
  extraction: GeminiResumeExtraction,
  createId: IdFactory = () => crypto.randomUUID(),
): PortfolioData {
  const portfolio: PortfolioData = {
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
      projectUrl: cleanText(item.projectUrl),
      githubUrl: cleanText(item.githubUrl),
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
      credentialUrl: cleanText(item.credentialUrl),
    })),
    links: extraction.links.map((item) => ({
      id: createId(),
      type: normalizeLinkType(item.type, item.url),
      label: cleanText(item.label),
      url: cleanText(item.url),
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

  return PortfolioDataSchema.parse(portfolio);
}
