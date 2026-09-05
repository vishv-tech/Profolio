import type {
  PortfolioScore,
  PortfolioScoreCategoryId,
  PortfolioScoreSuggestion,
} from "@/lib/portfolio-score/score";
import {
  PortfolioUpgradePlanSchema,
  type PortfolioUpgradePlan,
} from "@/lib/portfolio-intelligence/schemas";
import type { PortfolioData } from "@/types/portfolio";

const PRIORITY_TITLES: Readonly<Record<string, string>> = {
  "career-evidence": "Add verified career evidence",
  "content-depth": "Strengthen factual detail",
  "profile-contact": "Complete professional contact details",
  "profile-headline": "Clarify your professional direction",
  "profile-summary": "Strengthen your summary positioning",
  "projects-add": "Add a completed project",
  "projects-depth": "Show clearer project contribution",
  "proof-credentials": "Add earned credentials",
  "proof-links": "Strengthen professional proof",
  "skills-specific": "Organize demonstrable skills",
};

function priorityArea(
  category: PortfolioScoreCategoryId,
  data: PortfolioData,
): PortfolioUpgradePlan["priorities"][number]["area"] {
  if (category === "career") {
    return data.education.length > 0 && data.experience.length === 0
      ? "experience"
      : "education";
  }

  if (category === "content") return "structure";
  return category;
}

function priorityFromSuggestion(
  suggestion: PortfolioScoreSuggestion,
  data: PortfolioData,
  score: PortfolioScore,
): PortfolioUpgradePlan["priorities"][number] {
  const category = score.categories.find(
    (candidate) => candidate.id === suggestion.category,
  );

  return {
    area: priorityArea(suggestion.category, data),
    priority: suggestion.priority,
    title: PRIORITY_TITLES[suggestion.id] ?? "Improve portfolio completeness",
    reason: category
      ? `${category.label} currently scores ${category.score}/${category.maximum} in the deterministic portfolio analysis.`
      : "The deterministic portfolio analysis identified a completeness gap.",
    recommendation: suggestion.message,
  };
}

function buildStrengths(score: PortfolioScore): string[] {
  const strengths = [...score.categories]
    .filter((category) => category.score > 0)
    .sort(
      (left, right) =>
        right.score / right.maximum - left.score / left.maximum,
    )
    .slice(0, 3)
    .map(
      (category) =>
        `${category.label} currently scores ${category.score}/${category.maximum}.`,
    );

  return strengths.length > 0
    ? strengths
    : ["The current draft is ready for factual details to be added."];
}

function buildSkillSuggestions(
  data: PortfolioData,
  score: PortfolioScore,
): string[] {
  const scoreSuggestion = score.suggestions.find(
    (suggestion) => suggestion.id === "skills-specific",
  );
  if (scoreSuggestion) return [scoreSuggestion.message];

  return data.skills
    .filter((group) => group.category.trim() && group.items.length > 0)
    .slice(0, 2)
    .map(
      (group) =>
        `Connect your existing ${group.category.trim()} skills to the projects or education where you used them.`,
    );
}

function buildProjectIdeas(
  data: PortfolioData,
  score: PortfolioScore,
): string[] {
  const projectSuggestion = score.suggestions.find((suggestion) =>
    ["projects-add", "projects-depth"].includes(suggestion.id),
  );
  const projectsWithoutProof = data.projects
    .filter(
      (project) =>
        project.name.trim() &&
        !project.projectUrl.trim() &&
        !project.githubUrl.trim(),
    )
    .slice(0, 2);

  if (projectsWithoutProof.length > 0) {
    return projectsWithoutProof.map(
      (project) =>
        `Add a verified live demo or source link for “${project.name.trim()}” if one exists.`,
    );
  }

  return projectSuggestion ? [projectSuggestion.message] : [];
}

function buildCertificationIdeas(
  data: PortfolioData,
  score: PortfolioScore,
): string[] {
  const credentialSuggestion = score.suggestions.find(
    (suggestion) => suggestion.id === "proof-credentials",
  );
  if (credentialSuggestion) return [credentialSuggestion.message];

  return data.certifications.some(
    (certification) =>
      certification.name.trim() && !certification.credentialUrl.trim(),
  )
    ? ["Add official credential links for earned certifications when available."]
    : [];
}

function buildProfessionalPresence(
  data: PortfolioData,
  score: PortfolioScore,
): string[] {
  const linkSuggestion = score.suggestions.find(
    (suggestion) => suggestion.id === "proof-links",
  );
  if (linkSuggestion) return [linkSuggestion.message];

  const labels = data.links
    .filter((link) => link.label.trim() && link.url.trim())
    .slice(0, 3)
    .map((link) => link.label.trim());

  return labels.length > 0
    ? [
        `Keep your ${labels.join(", ")} presence aligned with the factual work shown in this portfolio.`,
      ]
    : [];
}

export function buildDeterministicUpgradePlan(
  data: PortfolioData,
  score: PortfolioScore,
): PortfolioUpgradePlan {
  const priorities = score.suggestions
    .slice(0, 6)
    .map((suggestion) => priorityFromSuggestion(suggestion, data, score));

  if (priorities.length === 0) {
    priorities.push({
      area: "structure",
      priority: "low",
      title: "Maintain factual consistency",
      reason: "The deterministic analysis found no current completeness gaps.",
      recommendation:
        "Keep future updates concise, verifiable, and aligned with the work already represented in the portfolio.",
    });
  }

  return PortfolioUpgradePlanSchema.parse({
    overview: `Your current portfolio scores ${score.score}/100 and is rated “${score.rating}”. This plan is based on the same deterministic completeness analysis shown in your workspace.`,
    strengths: buildStrengths(score),
    priorities,
    skillSuggestions: buildSkillSuggestions(data, score),
    projectIdeas: buildProjectIdeas(data, score),
    certificationIdeas: buildCertificationIdeas(data, score),
    professionalPresence: buildProfessionalPresence(data, score),
  });
}
