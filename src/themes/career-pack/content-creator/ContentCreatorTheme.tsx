import type { CSSProperties, ReactNode } from "react";
import {
  ArrowUpRight,
  AtSign,
  Award,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  Code2,
  Globe2,
  Mail,
  MapPin,
  PenTool,
  Phone,
  Play,
  Sparkles,
} from "lucide-react";

import type {
  CustomSection,
  LinkItem,
  PortfolioData,
  ProjectItem,
} from "@/types/portfolio";
import type { PortfolioSectionKey, ThemeConfig } from "@/types/theme";

import { getVisibleThemeSections, ThemeShell } from "../shared";
import { getThemeInitials } from "../shared/data";
import { formatThemeDate, formatThemeDateRange } from "../shared/dates";
import {
  getSafeEmailUrl,
  getSafeExternalUrl,
  getSafePhoneUrl,
  getThemeLinkLabel,
} from "../shared/links";
import type { ThemeComponentProps } from "../types";
import { CreatorPortrait } from "./CreatorPortrait";
import { CONTENT_CREATOR_CSS, styles } from "./ContentCreatorTheme.styles";

type RevealStyle = CSSProperties & { "--creator-delay": string };

interface CreatorLink {
  href: string;
  label: string;
  source: LinkItem;
}

interface SectionHeadingProps {
  description?: string;
  eyebrow: string;
  index: number;
  title: string;
}

const CREATOR_LINK_PRIORITY: Readonly<Record<LinkItem["type"], number>> = {
  youtube: 0,
  portfolio: 1,
  behance: 2,
  dribbble: 3,
  medium: 4,
  linkedin: 5,
  other: 6,
  github: 7,
};

function getCreatorLinks(data: PortfolioData, config: ThemeConfig): CreatorLink[] {
  if (!config.visibility.showLinks) {
    return [];
  }

  return data.links
    .flatMap((link) => {
      const href = getSafeExternalUrl(link.url);
      return href
        ? [{ href, label: getThemeLinkLabel(link), source: link }]
        : [];
    })
    .sort((left, right) => {
      const leftLabel = left.label.toLowerCase();
      const rightLabel = right.label.toLowerCase();
      const leftPriority = /instagram|tiktok/.test(leftLabel)
        ? 0
        : CREATOR_LINK_PRIORITY[left.source.type];
      const rightPriority = /instagram|tiktok/.test(rightLabel)
        ? 0
        : CREATOR_LINK_PRIORITY[right.source.type];

      return leftPriority - rightPriority;
    });
}

function CreatorLinkIcon({ link }: { link: LinkItem }) {
  const label = getThemeLinkLabel(link).toLowerCase();

  if (/instagram|tiktok/.test(label)) {
    return <Camera aria-hidden="true" />;
  }

  switch (link.type) {
    case "youtube":
      return <Play aria-hidden="true" />;
    case "behance":
    case "dribbble":
      return <PenTool aria-hidden="true" />;
    case "medium":
      return <BookOpen aria-hidden="true" />;
    case "linkedin":
      return <BriefcaseBusiness aria-hidden="true" />;
    case "github":
      return <Code2 aria-hidden="true" />;
    case "portfolio":
      return <Sparkles aria-hidden="true" />;
    case "other":
      return <Globe2 aria-hidden="true" />;
  }
}

function CreatorLinks({ links }: { links: CreatorLink[] }) {
  return links.length ? (
    <nav aria-label="Creator links" className={styles.socialLinks}>
      {links.map(({ href, label, source }) => (
        <a href={href} key={source.id} rel="noreferrer noopener" target="_blank">
          <CreatorLinkIcon link={source} />
          <span>{label}</span>
          <ArrowUpRight aria-hidden="true" className={styles.linkArrow} />
        </a>
      ))}
    </nav>
  ) : null;
}

function SectionHeading({
  description,
  eyebrow,
  index,
  title,
}: SectionHeadingProps) {
  return (
    <header className={styles.sectionHeading}>
      <div className={styles.sectionIndex} aria-hidden="true">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <span className={styles.indexRule} />
      </div>
      <div>
        <p className={styles.sectionEyebrow}>{eyebrow}</p>
        <h2 id={`creator-section-${index}`}>{title}</h2>
        {description ? <p className={styles.sectionDescription}>{description}</p> : null}
      </div>
    </header>
  );
}

function MetaLine({ children }: { children: ReactNode }) {
  return <p className={styles.metaLine}>{children}</p>;
}

function TagList({ items, label = "Tags" }: { items: string[]; label?: string }) {
  const visibleItems = items.filter((item) => item.trim());
  return visibleItems.length ? (
    <ul aria-label={label} className={styles.tagList}>
      {visibleItems.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  ) : null;
}

function HighlightList({ items }: { items: string[] }) {
  const visibleItems = items.filter((item) => item.trim());
  return visibleItems.length ? (
    <ul className={styles.highlightList}>
      {visibleItems.map((item, index) => (
        <li key={`${item}-${index}`}>
          <span aria-hidden="true">↳</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  ) : null;
}

function ExternalAction({ href, label }: { href: string; label: string }) {
  const safeHref = getSafeExternalUrl(href);
  return safeHref ? (
    <a
      className={styles.externalAction}
      href={safeHref}
      rel="noreferrer noopener"
      target="_blank"
    >
      <span>{label}</span>
      <ArrowUpRight aria-hidden="true" />
    </a>
  ) : null;
}

function AboutSection({ data, index }: { data: PortfolioData; index: number }) {
  return (
    <section
      aria-labelledby={`creator-section-${index}`}
      className={`${styles.section} ${styles.aboutSection}`}
    >
      <SectionHeading
        description="The point of view and practice behind the work."
        eyebrow="Creator profile"
        index={index}
        title="About me"
      />
      <div className={styles.aboutGrid}>
        <div className={styles.aboutMonogram} aria-hidden="true">
          <span>{getThemeInitials(data.personal.fullName)}</span>
          <small>profile / {String(index + 1).padStart(2, "0")}</small>
        </div>
        <div className={styles.aboutCopy}>
          <AtSign aria-hidden="true" />
          <p>{data.summary}</p>
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ item, index }: { item: ProjectItem; index: number }) {
  const range = formatThemeDateRange(item.startDate, item.endDate);

  return (
    <article
      className={`${styles.projectCard} ${index % 3 === 0 ? styles.projectCardWide : ""}`}
    >
      <div className={styles.projectGraphic} aria-hidden="true">
        <span className={styles.projectNumber}>{String(index + 1).padStart(2, "0")}</span>
        <span className={styles.projectOrb} />
        <span className={styles.projectFrameLabel}>selected / work</span>
      </div>
      <div className={styles.projectBody}>
        <div className={styles.cardTopline}>
          <span>Creative work</span>
          {range ? <span>{range}</span> : null}
        </div>
        <h3>{item.name || "Untitled project"}</h3>
        {item.description.trim() ? <p>{item.description}</p> : null}
        <HighlightList items={item.highlights} />
        <TagList items={item.technologies} label={`${item.name || "Project"} capabilities`} />
        <div className={styles.actionRow}>
          <ExternalAction href={item.projectUrl} label="View project" />
          <ExternalAction href={item.githubUrl} label="View source" />
        </div>
      </div>
    </article>
  );
}

function ProjectsSection({ data, index }: { data: PortfolioData; index: number }) {
  return (
    <section
      aria-labelledby={`creator-section-${index}`}
      className={styles.section}
    >
      <SectionHeading
        description="Campaigns, concepts, and selected projects—presented from the actual portfolio data."
        eyebrow="Portfolio edit"
        index={index}
        title="Selected work"
      />
      <div className={styles.projectGrid}>
        {data.projects.map((item, itemIndex) => (
          <ProjectCard index={itemIndex} item={item} key={item.id} />
        ))}
      </div>
    </section>
  );
}

function ExperienceSection({ data, index }: { data: PortfolioData; index: number }) {
  return (
    <section aria-labelledby={`creator-section-${index}`} className={styles.section}>
      <SectionHeading
        description="Roles, partnerships, and the context behind each contribution."
        eyebrow="Working history"
        index={index}
        title="Collaborations / experience"
      />
      <div className={styles.experienceList}>
        {data.experience.map((item, itemIndex) => (
          <article className={styles.experienceItem} key={item.id}>
            <span className={styles.experienceNumber} aria-hidden="true">
              {String(itemIndex + 1).padStart(2, "0")}
            </span>
            <div className={styles.experienceIdentity}>
              <p>{item.company || "Independent"}</p>
              <h3>{item.role || "Creative contributor"}</h3>
              <MetaLine>
                {[item.employmentType, item.location].filter(Boolean).join(" · ")}
              </MetaLine>
            </div>
            <div className={styles.experienceStory}>
              <MetaLine>
                {formatThemeDateRange(item.startDate, item.endDate, item.isCurrent)}
              </MetaLine>
              {item.description.trim() ? <p>{item.description}</p> : null}
              <HighlightList items={item.highlights} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SkillsSection({ data, index }: { data: PortfolioData; index: number }) {
  return (
    <section aria-labelledby={`creator-section-${index}`} className={styles.section}>
      <SectionHeading
        description="A flexible view of the capabilities already present in this portfolio."
        eyebrow="Capabilities"
        index={index}
        title="Creative toolkit"
      />
      <div className={styles.skillGrid}>
        {data.skills.map((group, groupIndex) => (
          <article className={styles.skillCard} key={group.id}>
            <span aria-hidden="true">{String(groupIndex + 1).padStart(2, "0")}</span>
            <h3>{group.category || "Capabilities"}</h3>
            <TagList items={group.items} label={group.category || "Capabilities"} />
          </article>
        ))}
      </div>
    </section>
  );
}

function AchievementsSection({ data, index }: { data: PortfolioData; index: number }) {
  return (
    <section aria-labelledby={`creator-section-${index}`} className={styles.section}>
      <SectionHeading
        description="Only factual milestones and recognition supplied by the portfolio owner."
        eyebrow="Proof points"
        index={index}
        title="Highlights / recognition"
      />
      <div className={styles.achievementGrid}>
        {data.achievements.map((item) => (
          <article className={styles.achievementCard} key={item.id}>
            <Award aria-hidden="true" />
            <div>
              <h3>{item.title}</h3>
              <MetaLine>
                {[item.issuer, formatThemeDate(item.date)].filter(Boolean).join(" · ")}
              </MetaLine>
              {item.description.trim() ? <p>{item.description}</p> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EducationSection({ data, index }: { data: PortfolioData; index: number }) {
  return (
    <section aria-labelledby={`creator-section-${index}`} className={styles.section}>
      <SectionHeading eyebrow="Foundation" index={index} title="Education" />
      <div className={styles.compactList}>
        {data.education.map((item) => (
          <article key={item.id}>
            <CalendarDays aria-hidden="true" />
            <div>
              <h3>{item.degree || item.institution}</h3>
              <MetaLine>
                {[item.fieldOfStudy, item.institution, item.location]
                  .filter(Boolean)
                  .join(" · ")}
              </MetaLine>
              <MetaLine>{formatThemeDateRange(item.startDate, item.endDate)}</MetaLine>
              {item.grade.trim() ? <p className={styles.compactAccent}>{item.grade}</p> : null}
              {item.description.trim() ? <p>{item.description}</p> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CertificationsSection({ data, index }: { data: PortfolioData; index: number }) {
  return (
    <section aria-labelledby={`creator-section-${index}`} className={styles.section}>
      <SectionHeading eyebrow="Supporting detail" index={index} title="Credentials" />
      <div className={styles.credentialList}>
        {data.certifications.map((item) => (
          <article key={item.id}>
            <div>
              <h3>{item.name}</h3>
              <MetaLine>
                {[item.issuer, formatThemeDate(item.issueDate)].filter(Boolean).join(" · ")}
              </MetaLine>
              {item.expiryDate.trim() ? (
                <MetaLine>Expires {formatThemeDate(item.expiryDate)}</MetaLine>
              ) : null}
              {item.credentialId.trim() ? (
                <p className={styles.credentialId}>ID / {item.credentialId}</p>
              ) : null}
            </div>
            <ExternalAction href={item.credentialUrl} label="View credential" />
          </article>
        ))}
      </div>
    </section>
  );
}

function LanguagesSection({ data, index }: { data: PortfolioData; index: number }) {
  return (
    <section
      aria-labelledby={`creator-section-${index}`}
      className={`${styles.section} ${styles.smallSection}`}
    >
      <SectionHeading eyebrow="Communication" index={index} title="Languages" />
      <ul className={styles.languageList}>
        {data.languages.map((item) => (
          <li key={item.id}>
            <span>{item.name}</span>
            <span>{item.proficiency}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function InterestsSection({ data, index }: { data: PortfolioData; index: number }) {
  return (
    <section
      aria-labelledby={`creator-section-${index}`}
      className={`${styles.section} ${styles.smallSection}`}
    >
      <SectionHeading eyebrow="Off camera" index={index} title="Beyond the work" />
      <TagList items={data.interests} label="Interests" />
    </section>
  );
}

function CustomSectionCard({
  section,
  index,
}: {
  section: CustomSection;
  index: number;
}) {
  return (
    <article className={`${styles.customCard} ${index % 2 ? styles.customCardOffset : ""}`}>
      <header>
        <span aria-hidden="true">({String(index + 1).padStart(2, "0")})</span>
        <h3>{section.title || "Additional details"}</h3>
      </header>
      <div className={styles.customItems}>
        {section.items.map((item) => (
          <div key={item.id}>
            <h4>{item.title}</h4>
            <MetaLine>{[item.subtitle, item.date].filter(Boolean).join(" · ")}</MetaLine>
            {item.description.trim() ? <p>{item.description}</p> : null}
          </div>
        ))}
      </div>
    </article>
  );
}

function CustomSections({ data, index }: { data: PortfolioData; index: number }) {
  return (
    <section
      aria-labelledby={`creator-section-${index}`}
      className={`${styles.section} ${styles.customSection}`}
    >
      <SectionHeading
        description="Flexible space for services, campaigns, press, brand work, or any other real portfolio chapter."
        eyebrow="Open format"
        index={index}
        title="More of the story"
      />
      <div className={styles.customGrid}>
        {data.customSections.map((section, sectionIndex) => (
          <CustomSectionCard index={sectionIndex} key={section.id} section={section} />
        ))}
      </div>
    </section>
  );
}

function renderCreatorSection(
  sectionKey: PortfolioSectionKey,
  data: PortfolioData,
  index: number,
): ReactNode {
  switch (sectionKey) {
    case "summary":
      return <AboutSection data={data} index={index} />;
    case "projects":
      return <ProjectsSection data={data} index={index} />;
    case "experience":
      return <ExperienceSection data={data} index={index} />;
    case "skills":
      return <SkillsSection data={data} index={index} />;
    case "achievements":
      return <AchievementsSection data={data} index={index} />;
    case "education":
      return <EducationSection data={data} index={index} />;
    case "certifications":
      return <CertificationsSection data={data} index={index} />;
    case "languages":
      return <LanguagesSection data={data} index={index} />;
    case "interests":
      return <InterestsSection data={data} index={index} />;
    case "customSections":
      return <CustomSections data={data} index={index} />;
  }
}

function CreatorFooter({
  config,
  data,
  links,
}: {
  config: ThemeConfig;
  data: PortfolioData;
  links: CreatorLink[];
}) {
  const emailHref = config.visibility.showEmail
    ? getSafeEmailUrl(data.personal.email)
    : null;
  const phoneHref = config.visibility.showPhone
    ? getSafePhoneUrl(data.personal.phone)
    : null;
  const location = config.visibility.showLocation
    ? data.personal.location.trim()
    : "";
  const hasContact = Boolean(emailHref || phoneHref || location);

  return (
    <footer className={styles.footer}>
      <div className={styles.footerTitle}>
        <span>Ready for the next frame</span>
        <p>{data.personal.fullName || "Creator portfolio"}</p>
      </div>
      {hasContact ? (
        <address aria-label="Contact details" className={styles.contactList}>
          {emailHref ? (
            <a href={emailHref}>
              <Mail aria-hidden="true" />
              <span>{data.personal.email.trim()}</span>
            </a>
          ) : null}
          {phoneHref ? (
            <a href={phoneHref}>
              <Phone aria-hidden="true" />
              <span>{data.personal.phone.trim()}</span>
            </a>
          ) : null}
          {location ? (
            <span>
              <MapPin aria-hidden="true" />
              <span>{location}</span>
            </span>
          ) : null}
        </address>
      ) : null}
      <CreatorLinks links={links} />
      <p className={styles.footerNote}>Creator portfolio / selected work</p>
    </footer>
  );
}

export default function ContentCreatorTheme({ data, config }: ThemeComponentProps) {
  const sections = getVisibleThemeSections(data, config);
  const creatorLinks = getCreatorLinks(data, config);
  const showPortrait = config.visibility.showProfileImage;
  const location = config.visibility.showLocation
    ? data.personal.location.trim()
    : "";

  return (
    <ThemeShell
      className={styles.root}
      config={config}
      layoutKey="career-content-creator"
    >
      <style>{CONTENT_CREATOR_CSS}</style>
      <div className={styles.creatorCanvas}>
        <header className={styles.hero}>
          <div className={styles.heroTopbar}>
            <span className={styles.brandMark}>PF / 01</span>
            <span>Digital creator portfolio</span>
            <span aria-hidden="true" className={styles.statusDots}>
              <i />
              <i />
              <i />
            </span>
          </div>

          <div
            className={`${styles.heroGrid} ${
              showPortrait ? "" : styles.heroGridWithoutPortrait
            }`}
          >
            <div className={styles.heroCopy}>
              <div className={styles.heroKicker}>
                <span>Content creator</span>
                {location ? <span>{location}</span> : null}
              </div>
              <p aria-hidden="true" className={styles.portfolioWord}>
                Portfolio
              </p>
              <div className={styles.identityBlock}>
                <p>Meet the creator</p>
                <h1>{data.personal.fullName || "Untitled creator"}</h1>
                {data.personal.headline.trim() ? (
                  <p className={styles.headline}>{data.personal.headline}</p>
                ) : null}
              </div>
              <CreatorLinks links={creatorLinks} />
            </div>

            {showPortrait ? (
              <CreatorPortrait
                fullName={data.personal.fullName}
                imageUrl={data.personal.profileImageUrl}
                key={data.personal.profileImageUrl}
              />
            ) : null}
          </div>

          <div aria-hidden="true" className={styles.heroMarquee}>
            <span>ideas</span>
            <i />
            <span>stories</span>
            <i />
            <span>culture</span>
            <i />
            <span>creative work</span>
          </div>
        </header>

        <main className={styles.main} id="creator-content">
          {sections.map((sectionKey, index) => (
            <div
              className={styles.reveal}
              data-section-key={sectionKey}
              key={sectionKey}
              style={{ "--creator-delay": `${Math.min(index, 6) * 70}ms` } as RevealStyle}
            >
              {renderCreatorSection(sectionKey, data, index)}
            </div>
          ))}
        </main>

        <CreatorFooter config={config} data={data} links={creatorLinks} />
      </div>
    </ThemeShell>
  );
}
