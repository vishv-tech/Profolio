import type { PortfolioData } from "@/types/portfolio";

export type PortfolioScoreCategoryId =
  | "profile"
  | "career"
  | "projects"
  | "skills"
  | "proof"
  | "content";

export type PortfolioScoreCategory = {
  id: PortfolioScoreCategoryId;
  label: string;
  score: number;
  maximum: number;
};

export type PortfolioScoreSuggestion = {
  id: string;
  category: PortfolioScoreCategoryId;
  priority: "high" | "medium";
  message: string;
};

export type PortfolioScore = {
  score: number;
  rating:
    | "Excellent"
    | "Strong"
    | "Good foundation"
    | "Needs improvement"
    | "Incomplete";
  categories: PortfolioScoreCategory[];
  suggestions: PortfolioScoreSuggestion[];
};

const CATEGORY_MAXIMUMS: Record<PortfolioScoreCategoryId, number> = {
  profile: 20,
  career: 20,
  projects: 20,
  skills: 15,
  proof: 15,
  content: 10,
};

function clean(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function hasText(value: string): boolean {
  return clean(value).length > 0;
}

function words(value: string): string[] {
  return clean(value).toLocaleLowerCase().match(/[\p{L}\p{N}+#.-]+/gu) ?? [];
}

function isMeaningful(value: string): boolean {
  const tokens = words(value);

  if (tokens.length < 8) {
    return false;
  }

  return new Set(tokens).size / tokens.length >= 0.45;
}

function ratioScore(matches: number, total: number, maximum: number): number {
  return total === 0 ? 0 : Math.round((matches / total) * maximum);
}

function validPublicUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function scoreProfile(data: PortfolioData): number {
  const contactCount = [data.personal.email, data.personal.phone].filter(hasText).length;
  let score = 0;

  score += hasText(data.personal.fullName) ? 3 : 0;
  score += hasText(data.personal.headline) ? 3 : 0;
  score += hasText(data.summary) ? 3 : 0;
  score += isMeaningful(data.summary) ? 5 : 0;
  score += contactCount > 0 ? 2 : 0;
  score += contactCount > 1 ? 1 : 0;
  score += hasText(data.personal.location) ? 2 : 0;
  score += validPublicUrl(data.personal.profileImageUrl) ? 1 : 0;

  return Math.min(score, CATEGORY_MAXIMUMS.profile);
}

function scoreExperience(data: PortfolioData): number {
  const entries = data.experience.filter(
    (item) => hasText(item.company) || hasText(item.role),
  );

  if (entries.length === 0) {
    return 0;
  }

  let score = 5;
  score += ratioScore(
    entries.filter((item) => hasText(item.company) && hasText(item.role)).length,
    entries.length,
    3,
  );
  score += ratioScore(
    entries.filter(
      (item) => hasText(item.startDate) && (item.isCurrent || hasText(item.endDate)),
    ).length,
    entries.length,
    2,
  );
  score += ratioScore(
    entries.filter(
      (item) =>
        isMeaningful(item.description) || item.highlights.some(isMeaningful),
    ).length,
    entries.length,
    3,
  );
  score += ratioScore(
    entries.filter((item) => item.highlights.some(hasText)).length,
    entries.length,
    2,
  );
  score += entries.length > 1 ? 1 : 0;

  return Math.min(score, 16);
}

function scoreEducation(data: PortfolioData): number {
  const entries = data.education.filter(
    (item) => hasText(item.institution) || hasText(item.degree),
  );

  if (entries.length === 0) {
    return 0;
  }

  let score = 5;
  score += ratioScore(
    entries.filter((item) => hasText(item.institution) && hasText(item.degree)).length,
    entries.length,
    4,
  );
  score += ratioScore(
    entries.filter((item) => hasText(item.fieldOfStudy)).length,
    entries.length,
    2,
  );
  score += ratioScore(
    entries.filter((item) => hasText(item.startDate) || hasText(item.endDate)).length,
    entries.length,
    2,
  );
  score += ratioScore(
    entries.filter((item) => hasText(item.grade) || isMeaningful(item.description)).length,
    entries.length,
    2,
  );
  score += entries.length > 1 ? 1 : 0;

  return Math.min(score, 16);
}

function scoreCareer(data: PortfolioData): number {
  const experience = scoreExperience(data);
  const education = scoreEducation(data);
  const primary = Math.max(experience, education);
  const supporting = Math.min(experience, education);

  return Math.min(primary + (supporting > 0 ? Math.max(2, Math.round(supporting / 4)) : 0), 20);
}

function scoreProjects(data: PortfolioData): number {
  const entries = data.projects.filter((item) => hasText(item.name));

  if (entries.length === 0) {
    return 0;
  }

  let score = 5;
  score += ratioScore(entries.filter((item) => hasText(item.name)).length, entries.length, 3);
  score += ratioScore(
    entries.filter((item) => isMeaningful(item.description)).length,
    entries.length,
    4,
  );
  score += ratioScore(
    entries.filter((item) => item.technologies.some(hasText)).length,
    entries.length,
    3,
  );
  score += ratioScore(
    entries.filter((item) => item.highlights.some(hasText)).length,
    entries.length,
    3,
  );
  score += ratioScore(
    entries.filter(
      (item) => validPublicUrl(item.projectUrl) || validPublicUrl(item.githubUrl),
    ).length,
    entries.length,
    2,
  );

  return Math.min(score, CATEGORY_MAXIMUMS.projects);
}

function scoreSkills(data: PortfolioData): number {
  const groups = data.skills.filter((group) => group.items.some(hasText));
  const allSkills = groups.flatMap((group) => group.items.map(clean).filter(Boolean));
  const uniqueSkills = new Set(allSkills.map((skill) => skill.toLocaleLowerCase()));
  const count = uniqueSkills.size;
  const breadth = count >= 12 ? 11 : count >= 8 ? 9 : count >= 4 ? 6 : count > 0 ? 3 : 0;
  const categories = Math.min(3, new Set(groups.map((group) => clean(group.category))).size);
  const cleanDataBonus = allSkills.length > 0 && allSkills.length === uniqueSkills.size ? 1 : 0;

  return Math.min(breadth + categories + cleanDataBonus, CATEGORY_MAXIMUMS.skills);
}

function scoreProof(data: PortfolioData): number {
  const links = data.links.filter((link) => validPublicUrl(link.url));
  const professionalTypes = new Set(
    links.map((link) => link.type).filter((type) => type !== "other"),
  );
  const linkScore =
    professionalTypes.size >= 3 ? 7 : professionalTypes.size === 2 ? 5 : professionalTypes.size === 1 ? 3 : 0;
  const completeAchievement = data.achievements.some(
    (item) => hasText(item.title) && (hasText(item.issuer) || isMeaningful(item.description)),
  );
  const completeCertification = data.certifications.some(
    (item) => hasText(item.name) && hasText(item.issuer),
  );
  const hasCredibilityEvidence = data.achievements.some((item) => hasText(item.title)) ||
    data.certifications.some((item) => hasText(item.name));
  const credibilityScore = completeAchievement && completeCertification
    ? 4
    : completeAchievement || completeCertification
      ? 3
      : hasCredibilityEvidence
        ? 2
        : 0;
  const workProofCount = data.projects.filter(
    (item) => validPublicUrl(item.projectUrl) || validPublicUrl(item.githubUrl),
  ).length + data.certifications.filter((item) => validPublicUrl(item.credentialUrl)).length;
  const workProofScore = workProofCount >= 2 ? 4 : workProofCount === 1 ? 2 : 0;

  return Math.min(linkScore + credibilityScore + workProofScore, CATEGORY_MAXIMUMS.proof);
}

function scoreContent(data: PortfolioData): number {
  const narratives = [
    ...data.experience.map((item) => item.description),
    ...data.education.map((item) => item.description),
    ...data.projects.map((item) => item.description),
    ...data.achievements.map((item) => item.description),
    ...data.customSections.flatMap((section) => section.items.map((item) => item.description)),
  ].filter(hasText);
  const highlights = [
    ...data.experience.flatMap((item) => item.highlights),
    ...data.projects.flatMap((item) => item.highlights),
  ].filter(hasText);
  const allNarrative = [data.summary, ...narratives, ...highlights].map(clean).filter(Boolean);
  const uniqueNarrative = new Set(allNarrative.map((value) => value.toLocaleLowerCase()));

  let score = isMeaningful(data.summary) ? 3 : hasText(data.summary) ? 1 : 0;
  score += ratioScore(narratives.filter(isMeaningful).length, narratives.length, 4);
  score += ratioScore(highlights.filter(isMeaningful).length, highlights.length, 2);
  score += allNarrative.length > 0 && uniqueNarrative.size === allNarrative.length ? 1 : 0;

  return Math.min(score, CATEGORY_MAXIMUMS.content);
}

function ratingFor(score: number): PortfolioScore["rating"] {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Strong";
  if (score >= 60) return "Good foundation";
  if (score >= 40) return "Needs improvement";
  return "Incomplete";
}

function suggestion(
  categories: Map<PortfolioScoreCategoryId, PortfolioScoreCategory>,
  id: string,
  category: PortfolioScoreCategoryId,
  message: string,
): PortfolioScoreSuggestion {
  const result = categories.get(category);
  const priority = result && result.score / result.maximum < 0.5 ? "high" : "medium";
  return { id, category, priority, message };
}

function buildSuggestions(
  data: PortfolioData,
  categories: PortfolioScoreCategory[],
): PortfolioScoreSuggestion[] {
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const suggestions: PortfolioScoreSuggestion[] = [];

  if (!hasText(data.personal.headline)) {
    suggestions.push(suggestion(categoryMap, "profile-headline", "profile", "Add a concise headline that reflects your current role or direction."));
  }
  if (!isMeaningful(data.summary)) {
    suggestions.push(suggestion(categoryMap, "profile-summary", "profile", "Strengthen your professional summary with a focused introduction grounded in your real experience and goals."));
  }
  if (!hasText(data.personal.email) && !hasText(data.personal.phone)) {
    suggestions.push(suggestion(categoryMap, "profile-contact", "profile", "Add a professional contact method you are comfortable sharing."));
  }
  if (scoreExperience(data) === 0 && scoreEducation(data) === 0) {
    suggestions.push(suggestion(categoryMap, "career-evidence", "career", "Add education, experience, or relevant training that you have actually completed."));
  }
  if (data.projects.every((project) => !hasText(project.name))) {
    suggestions.push(suggestion(categoryMap, "projects-add", "projects", "Add a project you have completed and explain the problem, your contribution, and the result."));
  } else if (data.projects.some((project) => hasText(project.name) && !isMeaningful(project.description))) {
    suggestions.push(suggestion(categoryMap, "projects-depth", "projects", "Clarify project descriptions with your real contribution, tools, and outcomes; include metrics only when you can verify them."));
  }
  if (scoreSkills(data) < 9) {
    suggestions.push(suggestion(categoryMap, "skills-specific", "skills", "Group the specific skills you can demonstrate through your work or education."));
  }
  if (data.links.filter((link) => validPublicUrl(link.url) && link.type !== "other").length === 0) {
    suggestions.push(suggestion(categoryMap, "proof-links", "proof", "Add a relevant professional profile such as LinkedIn, GitHub, Behance, or a personal site if you have one."));
  }
  if (scoreProof(data) < 8 && data.achievements.length === 0 && data.certifications.length === 0) {
    suggestions.push(suggestion(categoryMap, "proof-credentials", "proof", "Add relevant achievements or certifications if you have them; never list credentials you have not earned."));
  }
  if (scoreContent(data) < 6) {
    suggestions.push(suggestion(categoryMap, "content-depth", "content", "Use clear, specific descriptions and remove repeated filler. Add measurable outcomes only when they are factual."));
  }

  const priorityOrder = { high: 0, medium: 1 } as const;
  return suggestions.sort((left, right) => priorityOrder[left.priority] - priorityOrder[right.priority]);
}

export function scorePortfolio(data: PortfolioData): PortfolioScore {
  const categories: PortfolioScoreCategory[] = [
    { id: "profile", label: "Profile", score: scoreProfile(data), maximum: CATEGORY_MAXIMUMS.profile },
    { id: "career", label: "Experience & education", score: scoreCareer(data), maximum: CATEGORY_MAXIMUMS.career },
    { id: "projects", label: "Projects", score: scoreProjects(data), maximum: CATEGORY_MAXIMUMS.projects },
    { id: "skills", label: "Skills", score: scoreSkills(data), maximum: CATEGORY_MAXIMUMS.skills },
    { id: "proof", label: "Proof & links", score: scoreProof(data), maximum: CATEGORY_MAXIMUMS.proof },
    { id: "content", label: "Content quality", score: scoreContent(data), maximum: CATEGORY_MAXIMUMS.content },
  ];
  const score = categories.reduce((total, category) => total + category.score, 0);

  return {
    score,
    rating: ratingFor(score),
    categories,
    suggestions: buildSuggestions(data, categories),
  };
}
