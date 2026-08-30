import type { PortfolioScore } from "@/lib/portfolio-score/score";
import type { ContentImprovementTarget } from "@/lib/portfolio-intelligence/schemas";
import type { PortfolioData } from "@/types/portfolio";

const MAX_ITEMS = 8;
const MAX_LIST_ITEMS = 12;

function text(value: string, maximum = 2_000): string {
  return value.trim().slice(0, maximum);
}

function list(values: string[]): string[] {
  return values.map((value) => text(value, 500)).filter(Boolean).slice(0, MAX_LIST_ITEMS);
}

export function sanitizePortfolioForIntelligence(data: PortfolioData) {
  return {
    personal: {
      headline: text(data.personal.headline),
      location: text(data.personal.location, 200),
    },
    summary: text(data.summary),
    experience: data.experience.slice(0, MAX_ITEMS).map((item) => ({
      company: text(item.company, 300),
      role: text(item.role, 300),
      employmentType: text(item.employmentType, 200),
      startDate: text(item.startDate, 100),
      endDate: text(item.endDate, 100),
      isCurrent: item.isCurrent,
      description: text(item.description),
      highlights: list(item.highlights),
    })),
    education: data.education.slice(0, MAX_ITEMS).map((item) => ({
      institution: text(item.institution, 300),
      degree: text(item.degree, 300),
      fieldOfStudy: text(item.fieldOfStudy, 300),
      startDate: text(item.startDate, 100),
      endDate: text(item.endDate, 100),
      grade: text(item.grade, 100),
      description: text(item.description),
    })),
    projects: data.projects.slice(0, MAX_ITEMS).map((item) => ({
      name: text(item.name, 300),
      description: text(item.description),
      technologies: list(item.technologies),
      highlights: list(item.highlights),
    })),
    skills: data.skills.slice(0, MAX_ITEMS).map((group) => ({
      category: text(group.category, 200),
      items: list(group.items),
    })),
    achievements: data.achievements.slice(0, MAX_ITEMS).map((item) => ({
      title: text(item.title, 300),
      issuer: text(item.issuer, 300),
      date: text(item.date, 100),
      description: text(item.description),
    })),
    certifications: data.certifications.slice(0, MAX_ITEMS).map((item) => ({
      name: text(item.name, 300),
      issuer: text(item.issuer, 300),
      issueDate: text(item.issueDate, 100),
      expiryDate: text(item.expiryDate, 100),
    })),
    links: data.links.slice(0, MAX_ITEMS).map((item) => ({
      type: item.type,
      label: text(item.label, 200),
    })),
    languages: data.languages.slice(0, MAX_ITEMS).map((item) => ({
      name: text(item.name, 200),
      proficiency: text(item.proficiency, 200),
    })),
    interests: list(data.interests),
    customSections: data.customSections.slice(0, MAX_ITEMS).map((section) => ({
      title: text(section.title, 300),
      items: section.items.slice(0, MAX_ITEMS).map((item) => ({
        title: text(item.title, 300),
        subtitle: text(item.subtitle, 300),
        date: text(item.date, 100),
        description: text(item.description),
      })),
    })),
  };
}

export function createUpgradePlanContext(
  data: PortfolioData,
  score: PortfolioScore,
) {
  return {
    portfolio: sanitizePortfolioForIntelligence(data),
    deterministicAnalysis: {
      score: score.score,
      rating: score.rating,
      categories: score.categories,
      gaps: score.suggestions.map(({ category, message, priority }) => ({
        category,
        message,
        priority,
      })),
    },
  };
}

export function createImprovementContext(
  data: PortfolioData,
  target: ContentImprovementTarget,
) {
  return {
    target,
    portfolioOutline: {
      headline: text(data.personal.headline, 300),
      experience: data.experience.slice(0, MAX_ITEMS).map((item) => ({
        company: text(item.company, 300),
        role: text(item.role, 300),
      })),
      projects: data.projects.slice(0, MAX_ITEMS).map((item) => ({
        name: text(item.name, 300),
        technologies: list(item.technologies),
      })),
      skills: data.skills.slice(0, MAX_ITEMS).map((group) => ({
        category: text(group.category, 200),
        items: list(group.items),
      })),
    },
  };
}
