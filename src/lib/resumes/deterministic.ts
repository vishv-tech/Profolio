import {
  createEmptyAchievement,
  createEmptyCertification,
  createEmptyEducation,
  createEmptyExperience,
  createEmptyPortfolioData,
  createEmptyProject,
  createEmptySkillGroup,
  type PortfolioIdFactory,
} from "@/lib/portfolios/defaults";
import { extractVisibleResumeLinks } from "@/lib/resumes/links";
import { cleanResumeText, isUsableResumeText } from "@/lib/resumes/text";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";
import type { PortfolioData } from "@/types/portfolio";

type ResumeSectionKey =
  | "achievements"
  | "certifications"
  | "education"
  | "experience"
  | "interests"
  | "languages"
  | "projects"
  | "skills"
  | "summary";

type ResumeSections = Record<ResumeSectionKey, string[]> & {
  header: string[];
};

const SECTION_ALIASES: Record<ResumeSectionKey, readonly string[]> = {
  achievements: ["achievements", "awards"],
  certifications: ["certifications", "certificates"],
  education: ["education", "academic qualifications"],
  experience: [
    "experience",
    "work experience",
    "employment",
    "internship",
    "internships",
  ],
  interests: ["interests", "hobbies"],
  languages: ["languages"],
  projects: ["projects", "academic projects", "personal projects"],
  skills: ["skills", "technical skills", "technologies"],
  summary: [
    "summary",
    "profile",
    "career objective",
    "objective",
    "professional summary",
  ],
};

const HEADING_LOOKUP = new Map(
  Object.entries(SECTION_ALIASES).flatMap(([section, aliases]) =>
    aliases.map((alias) => [alias, section as ResumeSectionKey] as const),
  ),
);
const PAGE_MARKER = /^\[Page \d+\]$/iu;
const BULLET_PREFIX = /^\s*[-*•▪◦]\s*/u;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu;
const PHONE_PATTERN = /(?:\+\s*)?(?:\(\s*\d{1,4}\s*\)|\d{1,4})[\d\s().-]{6,}\d/gu;
const DATE_SIGNAL = /\b(?:19|20)\d{2}\b|\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/iu;

function cleanLine(value: string) {
  return value.replace(BULLET_PREFIX, "").trim();
}

function normalizeHeading(value: string) {
  return value
    .trim()
    .replace(/[.:]+$/gu, "")
    .replace(/\s+/gu, " ")
    .toLowerCase();
}

function detectHeading(line: string, activeSection: ResumeSectionKey | null) {
  const trimmed = cleanLine(line);
  const exactSection = HEADING_LOOKUP.get(normalizeHeading(trimmed));

  if (exactSection) {
    return { content: "", section: exactSection };
  }

  const colonIndex = trimmed.indexOf(":");

  if (colonIndex <= 0) {
    return null;
  }

  const headingLabel = trimmed.slice(0, colonIndex).trim();
  const section = HEADING_LOOKUP.get(normalizeHeading(headingLabel));

  return section &&
    (activeSection === null || headingLabel === headingLabel.toUpperCase())
    ? { content: trimmed.slice(colonIndex + 1).trim(), section }
    : null;
}

export function splitDeterministicResumeSections(text: string): ResumeSections {
  const sections: ResumeSections = {
    achievements: [],
    certifications: [],
    education: [],
    experience: [],
    header: [],
    interests: [],
    languages: [],
    projects: [],
    skills: [],
    summary: [],
  };
  let activeSection: ResumeSectionKey | null = null;

  for (const rawLine of cleanResumeText(text).split("\n")) {
    if (PAGE_MARKER.test(rawLine.trim())) {
      continue;
    }

    const heading = detectHeading(rawLine, activeSection);

    if (heading) {
      activeSection = heading.section;
      if (heading.content) {
        sections[activeSection].push(heading.content);
      }
      continue;
    }

    sections[activeSection ?? "header"].push(rawLine.trim());
  }

  return sections;
}

function nonEmptyLines(lines: readonly string[]) {
  return lines.map(cleanLine).filter(Boolean);
}

function splitExplicitList(lines: readonly string[]) {
  const items = nonEmptyLines(lines).flatMap((line) =>
    line
      .split(/\s*(?:,|;|\|)\s*/u)
      .map((item) => item.trim())
      .filter(Boolean),
  );

  return [...new Set(items)];
}

function findLabeledValue(lines: readonly string[], labels: readonly string[]) {
  const normalizedLabels = new Set(labels.map((label) => label.toLowerCase()));

  for (const line of lines) {
    const match = /^\s*([^:]{1,40})\s*:\s*(.+)$/u.exec(cleanLine(line));

    if (match && normalizedLabels.has(match[1].trim().toLowerCase())) {
      return match[2].trim();
    }
  }

  return "";
}

function isLabeledLine(line: string) {
  return /^\s*[^:]{1,40}\s*:\s*.+$/u.test(cleanLine(line));
}

function linesToBlocks(lines: readonly string[], starterLabels: readonly string[]) {
  const blocks: string[][] = [];
  let current: string[] = [];
  const starterPattern = new RegExp(
    `^(?:${starterLabels.join("|")}):\\s*`,
    "iu",
  );

  const flush = () => {
    if (current.some((line) => cleanLine(line))) {
      blocks.push(current);
    }
    current = [];
  };

  for (const line of lines) {
    const cleaned = cleanLine(line);

    if (!cleaned) {
      flush();
      continue;
    }

    if (current.length > 0 && starterPattern.test(cleaned)) {
      flush();
    }

    current.push(line);
  }

  flush();
  return blocks;
}

function parseDateRange(value: string) {
  if (!DATE_SIGNAL.test(value)) {
    return { endDate: "", isCurrent: false, startDate: "" };
  }

  const parts = value
    .split(/\s+(?:-|–|—|to)\s+/iu)
    .map((part) => part.trim())
    .filter(Boolean);
  const startDate = parts[0] ?? "";
  const rawEndDate = parts[1] ?? "";
  const isCurrent = /^(?:current|present|now)$/iu.test(rawEndDate);

  return {
    endDate: isCurrent ? "" : rawEndDate,
    isCurrent,
    startDate,
  };
}

function extractPhone(header: readonly string[]) {
  const headerText = header.join(" ");

  for (const match of headerText.matchAll(PHONE_PATTERN)) {
    const value = match[0].trim();
    const digits = value.replace(/\D/gu, "");

    if (
      digits.length >= 8 &&
      digits.length <= 15 &&
      !/^(?:19|20)\d{2}\s*[-–—]\s*(?:19|20)\d{2}$/u.test(value)
    ) {
      return value.replace(/\s+/gu, " ");
    }
  }

  return "";
}

function extractName(header: readonly string[]) {
  for (const line of nonEmptyLines(header)) {
    if (
      line.length > 80 ||
      EMAIL_PATTERN.test(line) ||
      /https?:\/\/|www\./iu.test(line) ||
      /\d/u.test(line) ||
      /^(?:curriculum vitae|resume|résumé)$/iu.test(line)
    ) {
      continue;
    }

    const words = line.split(/\s+/u);

    if (
      words.length >= 2 &&
      words.length <= 5 &&
      words.every((word) => /^[\p{L}][\p{L}.'’-]*$/u.test(word))
    ) {
      return line;
    }
  }

  return "";
}

function extractLocation(header: readonly string[]) {
  const labeled = findLabeledValue(header, ["location", "address"]);

  if (labeled) {
    return labeled;
  }

  return (
    nonEmptyLines(header).find(
      (line) =>
        line.length <= 80 &&
        line.includes(",") &&
        !EMAIL_PATTERN.test(line) &&
        !/https?:\/\/|www\.|\d{5,}/iu.test(line),
    ) ?? ""
  );
}

function extractExperience(
  lines: readonly string[],
  createId: PortfolioIdFactory,
) {
  return linesToBlocks(lines, ["role", "title", "position"]).flatMap(
    (block) => {
      const item = createEmptyExperience(createId);
      item.role = findLabeledValue(block, ["role", "title", "position"]);
      item.company = findLabeledValue(block, [
        "company",
        "employer",
        "organization",
      ]);
      item.employmentType = findLabeledValue(block, ["employment type", "type"]);
      item.location = findLabeledValue(block, ["location"]);
      item.startDate = findLabeledValue(block, ["start date", "from"]);
      item.endDate = findLabeledValue(block, ["end date", "to"]);
      const combinedDates = findLabeledValue(block, ["dates", "duration"]);

      if (combinedDates && !item.startDate && !item.endDate) {
        Object.assign(item, parseDateRange(combinedDates));
      } else if (/^(?:current|present|now)$/iu.test(item.endDate)) {
        item.endDate = "";
        item.isCurrent = true;
      }

      const plainLines = block.filter(
        (line) => !isLabeledLine(line) && !BULLET_PREFIX.test(line),
      );
      const firstPlain = cleanLine(plainLines[0] ?? "");
      const roleAtCompany = /^(.{2,80}?)\s+at\s+(.{2,100})$/iu.exec(firstPlain);

      if (!item.role && !item.company && roleAtCompany) {
        item.role = roleAtCompany[1].trim();
        item.company = roleAtCompany[2].trim();
        plainLines.shift();
      }

      item.description = [
        findLabeledValue(block, ["description"]),
        ...plainLines.map(cleanLine),
      ]
        .filter(Boolean)
        .join("\n");
      item.highlights = block
        .filter((line) => BULLET_PREFIX.test(line))
        .map(cleanLine)
        .filter(Boolean);

      return item.role || item.company || item.description || item.highlights.length
        ? [item]
        : [];
    },
  );
}

function extractEducation(
  lines: readonly string[],
  createId: PortfolioIdFactory,
) {
  return linesToBlocks(lines, ["institution", "university", "college", "school"])
    .flatMap((block) => {
      const item = createEmptyEducation(createId);
      item.institution = findLabeledValue(block, [
        "institution",
        "university",
        "college",
        "school",
      ]);
      item.degree = findLabeledValue(block, ["degree", "qualification"]);
      item.fieldOfStudy = findLabeledValue(block, ["field", "field of study", "major"]);
      item.location = findLabeledValue(block, ["location"]);
      item.startDate = findLabeledValue(block, ["start date", "from"]);
      item.endDate = findLabeledValue(block, ["end date", "to"]);
      item.grade = findLabeledValue(block, ["grade", "gpa", "cgpa"]);
      const combinedDates = findLabeledValue(block, ["dates", "duration"]);

      if (combinedDates && !item.startDate && !item.endDate) {
        const dates = parseDateRange(combinedDates);
        item.startDate = dates.startDate;
        item.endDate = dates.endDate;
      }

      item.description = [
        findLabeledValue(block, ["description"]),
        ...block.filter((line) => !isLabeledLine(line)).map(cleanLine),
      ]
        .filter(Boolean)
        .join("\n");

      return item.institution || item.degree || item.description ? [item] : [];
    });
}

function extractProjects(
  lines: readonly string[],
  createId: PortfolioIdFactory,
) {
  return linesToBlocks(lines, ["project", "name"]).flatMap((block) => {
    const item = createEmptyProject(createId);
    item.name = findLabeledValue(block, ["project", "name"]);
    item.description = findLabeledValue(block, ["description"]);
    item.technologies = splitExplicitList([
      findLabeledValue(block, ["technologies", "technology", "tech stack", "tools"]),
    ]);
    item.startDate = findLabeledValue(block, ["start date", "from"]);
    item.endDate = findLabeledValue(block, ["end date", "to"]);
    const combinedDates = findLabeledValue(block, ["dates", "duration"]);

    if (combinedDates && !item.startDate && !item.endDate) {
      const dates = parseDateRange(combinedDates);
      item.startDate = dates.startDate;
      item.endDate = dates.endDate;
    }

    const links = extractVisibleResumeLinks(block.join("\n"));
    item.githubUrl = links.find((link) => link.type === "github")?.url ?? "";
    item.projectUrl =
      links.find((link) => link.type !== "github")?.url ?? "";
    item.highlights = block
      .filter((line) => BULLET_PREFIX.test(line))
      .map(cleanLine)
      .filter(Boolean);

    const plainLines = block
      .filter(
        (line) =>
          !isLabeledLine(line) &&
          !BULLET_PREFIX.test(line) &&
          extractVisibleResumeLinks(line).length === 0,
      )
      .map(cleanLine)
      .filter(Boolean);

    if (!item.name && plainLines[0] && plainLines[0].length <= 100) {
      item.name = plainLines.shift() ?? "";
    }

    if (!item.description) {
      item.description = plainLines.join("\n");
    }

    return item.name || item.description || item.highlights.length ? [item] : [];
  });
}

function extractSkills(lines: readonly string[], createId: PortfolioIdFactory) {
  const groups = [];

  for (const line of nonEmptyLines(lines)) {
    const labeled = /^([^:]{1,40}):\s*(.+)$/u.exec(line);
    const category = labeled?.[1].trim() || "Skills";
    const items = splitExplicitList([labeled?.[2] ?? line]);

    if (items.length > 0) {
      const group = createEmptySkillGroup(createId);
      group.category = category;
      group.items = items;
      groups.push(group);
    }
  }

  return groups;
}

function extractAchievements(
  lines: readonly string[],
  createId: PortfolioIdFactory,
) {
  return linesToBlocks(lines, ["title", "achievement", "award"]).flatMap(
    (block) => {
      const item = createEmptyAchievement(createId);
      item.title = findLabeledValue(block, ["title", "achievement", "award"]);
      item.issuer = findLabeledValue(block, ["issuer", "organization"]);
      item.date = findLabeledValue(block, ["date"]);
      item.description = findLabeledValue(block, ["description"]);
      const plain = block.filter((line) => !isLabeledLine(line)).map(cleanLine);

      if (!item.title) {
        item.title = plain.shift() ?? "";
      }
      if (!item.description) {
        item.description = plain.filter(Boolean).join("\n");
      }

      return item.title || item.description ? [item] : [];
    },
  );
}

function extractCertifications(
  lines: readonly string[],
  createId: PortfolioIdFactory,
) {
  return linesToBlocks(lines, ["name", "certification", "certificate"]).flatMap(
    (block) => {
      const item = createEmptyCertification(createId);
      item.name = findLabeledValue(block, ["name", "certification", "certificate"]);
      item.issuer = findLabeledValue(block, ["issuer", "organization"]);
      item.issueDate = findLabeledValue(block, ["issue date", "date"]);
      item.expiryDate = findLabeledValue(block, ["expiry date", "expiration date"]);
      item.credentialId = findLabeledValue(block, ["credential id"]);
      item.credentialUrl =
        extractVisibleResumeLinks(
          findLabeledValue(block, ["credential url", "url"]),
        )[0]?.url ?? "";
      const plain = block.filter((line) => !isLabeledLine(line)).map(cleanLine);

      if (!item.name) {
        item.name = plain.find(Boolean) ?? "";
      }

      return item.name ? [item] : [];
    },
  );
}

function extractLanguages(
  lines: readonly string[],
  createId: PortfolioIdFactory,
) {
  return splitExplicitList(lines).flatMap((value) => {
    const match = /^(.+?)(?:\s*\(([^)]+)\)|\s+[-–—]\s+(.+))$/u.exec(value);
    const name = (match?.[1] ?? value).trim();

    return name
      ? [{ id: createId(), name, proficiency: (match?.[2] ?? match?.[3] ?? "").trim() }]
      : [];
  });
}

export function isResumeTextUsable(text: string, pageCount: number) {
  const cleaned = cleanResumeText(text);

  if (!Number.isInteger(pageCount) || pageCount < 1 || !isUsableResumeText(cleaned)) {
    return false;
  }

  const contentLines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !PAGE_MARKER.test(line));
  const nonWhitespaceCharacters = cleaned.replace(/\s/gu, "").length;
  const meaningfulCharacters = cleaned.match(/[\p{L}\p{N}]/gu)?.length ?? 0;

  return (
    contentLines.length >= 4 &&
    nonWhitespaceCharacters >= 90 &&
    meaningfulCharacters / pageCount >= 40
  );
}

export function buildDeterministicPortfolio(
  text: string,
  createId: PortfolioIdFactory = () => crypto.randomUUID(),
) {
  const sections = splitDeterministicResumeSections(text);
  const portfolio = createEmptyPortfolioData();
  const fullText = cleanResumeText(text);

  portfolio.personal.fullName = extractName(sections.header);
  portfolio.personal.email = fullText.match(EMAIL_PATTERN)?.[0] ?? "";
  portfolio.personal.phone = extractPhone(sections.header);
  portfolio.personal.location = extractLocation(sections.header);
  portfolio.summary = nonEmptyLines(sections.summary).join("\n");
  portfolio.experience = extractExperience(sections.experience, createId);
  portfolio.education = extractEducation(sections.education, createId);
  portfolio.projects = extractProjects(sections.projects, createId);
  portfolio.skills = extractSkills(sections.skills, createId);
  portfolio.achievements = extractAchievements(sections.achievements, createId);
  portfolio.certifications = extractCertifications(
    sections.certifications,
    createId,
  );
  portfolio.links = extractVisibleResumeLinks(fullText).map((link) => ({
    id: createId(),
    ...link,
  }));
  portfolio.languages = extractLanguages(sections.languages, createId);
  portfolio.interests = splitExplicitList(sections.interests);

  return PortfolioDataSchema.parse(portfolio);
}

export function isDeterministicPortfolioUsable(portfolio: PortfolioData) {
  const hasIdentity = Boolean(
    portfolio.personal.fullName ||
      portfolio.personal.email ||
      portfolio.personal.phone,
  );
  const hasSubstantiveSection = Boolean(
    portfolio.summary.length >= 30 ||
      portfolio.experience.length ||
      portfolio.education.length ||
      portfolio.projects.length ||
      portfolio.skills.some((group) => group.items.length > 0),
  );

  return hasIdentity && hasSubstantiveSection;
}
