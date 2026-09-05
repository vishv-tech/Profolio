"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

import {
  formatThemeDate,
  formatThemeDateRange,
  getThemeFontStack,
  getThemeLinkLabel,
  getVisibleThemeSections,
} from "@/themes/career-pack/shared";
import {
  getEffectiveThemeAppearance,
  hasThemeStyleOverrides,
  isAiThemeEngineSupported,
} from "@/lib/theme-ai/capabilities";
import { getThemeInitials, SECTION_LABELS } from "@/themes/career-pack/shared/data";
import {
  getSafeEmailUrl,
  getSafeExternalUrl,
  getSafePhoneUrl,
} from "@/themes/career-pack/shared/links";
import type { PortfolioData } from "@/types/portfolio";
import type { PortfolioSectionKey, ThemeConfig } from "@/types/theme";

export type ThemeFlavor = "minimal" | "modern" | "bento" | "creative";

type PavniFrameStyle = CSSProperties & {
  "--accent": string;
  "--bg": string;
  "--ink": string;
  "--line": string;
  "--muted": string;
  "--pavni-body-font": string;
  "--pavni-heading-font": string;
  "--pavni-mono-font": string;
  "--radius": string;
  "--space": string;
  "--surface": string;
  "--theme-heading-scale": string;
};

const SPACING = {
  compact: "1rem",
  comfortable: "1.5rem",
  spacious: "2.25rem",
} as const;

const HEADING_SCALES = {
  small: "0.92",
  medium: "1",
  large: "1.12",
} as const;

function appearanceFrameStyle(
  appearance: ThemeConfig["appearance"],
): PavniFrameStyle {

  return {
    "--accent": appearance.accentColor,
    "--bg": appearance.backgroundColor,
    "--ink": appearance.textColor,
    "--line": appearance.borderColor,
    "--muted": appearance.mutedTextColor,
    "--pavni-body-font": getThemeFontStack(appearance.fontFamily),
    "--pavni-heading-font": getThemeFontStack(appearance.headingFontFamily),
    "--pavni-mono-font": getThemeFontStack("JetBrains Mono"),
    "--radius": `${appearance.borderRadius}px`,
    "--space": SPACING[appearance.spacing],
    "--surface": appearance.surfaceColor,
    "--theme-heading-scale":
      HEADING_SCALES[appearance.headingScale ?? "medium"],
    backgroundColor: appearance.backgroundColor,
    color: appearance.textColor,
    colorScheme: appearance.colorMode,
    fontFamily: getThemeFontStack(appearance.fontFamily),
  };
}

export function frameStyle(config: ThemeConfig): PavniFrameStyle {
  return appearanceFrameStyle(config.appearance);
}

export function themeFrameProps(config: ThemeConfig, layoutKey: string) {
  const appearance = getEffectiveThemeAppearance(config, layoutKey);
  const customized =
    isAiThemeEngineSupported(layoutKey) && hasThemeStyleOverrides(config);

  return {
    "data-ai-theme-customized": customized ? "true" : undefined,
    "data-animation": appearance.animationIntensity,
    "data-color-mode": appearance.colorMode,
    style: appearanceFrameStyle(appearance),
  } as const;
}

export function SafeProfileImage({
  alt,
  className,
  fallback,
  imageUrl,
  showImage,
}: {
  alt: string;
  className?: string;
  fallback: ReactNode;
  imageUrl: string;
  showImage: boolean;
}) {
  const safeImageUrl = showImage ? getSafeExternalUrl(imageUrl) : null;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const canRenderImage = Boolean(safeImageUrl && failedUrl !== safeImageUrl);

  return canRenderImage ? (
    // Profile image hosts are user-configured and cannot be statically allow-listed.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      className={className}
      decoding="async"
      onError={() => setFailedUrl(safeImageUrl)}
      src={safeImageUrl ?? undefined}
    />
  ) : (
    fallback
  );
}

export function ProfileIdentity({
  config,
  data,
  flavor,
}: {
  config: ThemeConfig;
  data: PortfolioData;
  flavor: ThemeFlavor;
}) {
  const { personal } = data;

  return (
    <div className={`profile-identity profile-${flavor}`}>
      {config.visibility.showProfileImage ? (
        <div className="avatar">
          <SafeProfileImage
            alt={`${personal.fullName || "Portfolio owner"} portrait`}
            fallback={
              <span aria-label={`${personal.fullName || "Portfolio owner"} initials`}>
                {getThemeInitials(personal.fullName)}
              </span>
            }
            imageUrl={personal.profileImageUrl}
            showImage
          />
        </div>
      ) : null}
      <div>
        <p className="eyebrow">Portfolio</p>
        <h1>{personal.fullName || "Untitled portfolio"}</h1>
        {personal.headline.trim() ? <p className="headline">{personal.headline}</p> : null}
      </div>
    </div>
  );
}

export function ContactLine({
  config,
  data,
}: {
  config: ThemeConfig;
  data: PortfolioData;
}) {
  const email = config.visibility.showEmail
    ? getSafeEmailUrl(data.personal.email)
    : null;
  const phone = config.visibility.showPhone
    ? getSafePhoneUrl(data.personal.phone)
    : null;
  const location = config.visibility.showLocation
    ? data.personal.location.trim()
    : "";
  const links = config.visibility.showLinks
    ? data.links.flatMap((link) => {
        const href = getSafeExternalUrl(link.url);
        return href ? [{ href, link }] : [];
      })
    : [];

  if (!email && !phone && !location && !links.length) {
    return null;
  }

  return (
    <div className="contact-block">
      {email || phone || location ? (
        <address aria-label="Contact details" className="contact-line">
          {email ? <a href={email}>{data.personal.email.trim()}</a> : null}
          {phone ? <a href={phone}>{data.personal.phone.trim()}</a> : null}
          {location ? <span>{location}</span> : null}
        </address>
      ) : null}
      {links.length ? (
        <nav aria-label="Portfolio links" className="contact-links">
          {links.map(({ href, link }) => (
            <a href={href} key={link.id} rel="noreferrer noopener" target="_blank">
              {getThemeLinkLabel(link)} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </nav>
      ) : null}
    </div>
  );
}

export function SectionTitle({
  children,
  flavor,
  index,
}: {
  children: ReactNode;
  flavor: ThemeFlavor;
  index?: number;
}) {
  return (
    <h2 className={`section-title title-${flavor}`}>
      {index !== undefined ? (
        <span>{String(index + 1).padStart(2, "0")}</span>
      ) : null}
      {children}
    </h2>
  );
}

function Details({ children }: { children: ReactNode }) {
  return <p className="item-detail">{children}</p>;
}

function Highlights({ items }: { items: string[] }) {
  const visibleItems = items.filter((item) => item.trim());
  return visibleItems.length ? (
    <ul className="highlights">
      {visibleItems.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  ) : null;
}

function Chips({ items, label = "Tags" }: { items: string[]; label?: string }) {
  const visibleItems = items.filter((item) => item.trim());
  return visibleItems.length ? (
    <div aria-label={label} className="chips" role="list">
      {visibleItems.map((item, index) => (
        <span key={`${item}-${index}`} role="listitem">{item}</span>
      ))}
    </div>
  ) : null;
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  const safeHref = getSafeExternalUrl(href);
  return safeHref ? (
    <a href={safeHref} rel="noreferrer noopener" target="_blank">
      {label} <span aria-hidden="true">↗</span>
    </a>
  ) : null;
}

export function SectionContent({
  data,
  flavor,
  section,
}: {
  data: PortfolioData;
  flavor: ThemeFlavor;
  section: PortfolioSectionKey;
}) {
  switch (section) {
    case "summary":
      return data.summary.trim() ? <p className="summary-copy">{data.summary}</p> : null;
    case "experience":
      return (
        <div className="timeline">
          {data.experience.map((item) => (
            <article className="experience-item" key={item.id}>
              <div className="item-date">
                {formatThemeDateRange(item.startDate, item.endDate, item.isCurrent)}
              </div>
              <div>
                <h3>{item.role || item.company}</h3>
                <p className="item-meta">
                  {[item.company, item.employmentType, item.location]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {item.description.trim() ? <p>{item.description}</p> : null}
                <Highlights items={item.highlights} />
              </div>
            </article>
          ))}
        </div>
      );
    case "projects":
      return (
        <div className={`project-grid projects-${flavor}`}>
          {data.projects.map((project, index) => (
            <article className="project-card" key={project.id}>
              <span className="project-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{project.name || "Untitled project"}</h3>
              <Details>{formatThemeDateRange(project.startDate, project.endDate)}</Details>
              {project.description.trim() ? <p>{project.description}</p> : null}
              <Highlights items={project.highlights} />
              <Chips items={project.technologies} label={`${project.name || "Project"} technologies`} />
              <div className="project-links">
                <ExternalLink href={project.projectUrl} label="View project" />
                <ExternalLink href={project.githubUrl} label="View source" />
              </div>
            </article>
          ))}
        </div>
      );
    case "skills":
      return (
        <div className="skill-groups">
          {data.skills.map((group) => (
            <div className="skill-group" key={group.id}>
              <p>{group.category || "Skills"}</p>
              <Chips items={group.items} label={group.category || "Skills"} />
            </div>
          ))}
        </div>
      );
    case "education":
      return (
        <div className="plain-list">
          {data.education.map((item) => (
            <article key={item.id}>
              <p className="item-date">
                {formatThemeDateRange(item.startDate, item.endDate)}
              </p>
              <h3>{item.degree || item.institution}</h3>
              <Details>
                {[item.fieldOfStudy, item.institution, item.location]
                  .filter(Boolean)
                  .join(" · ")}
              </Details>
              {item.grade.trim() ? <Details>{item.grade}</Details> : null}
              {item.description.trim() ? <p>{item.description}</p> : null}
            </article>
          ))}
        </div>
      );
    case "achievements":
      return (
        <div className="plain-list">
          {data.achievements.map((item) => (
            <article key={item.id}>
              <p className="item-date">{formatThemeDate(item.date)}</p>
              <h3>{item.title}</h3>
              {item.issuer.trim() ? <Details>{item.issuer}</Details> : null}
              {item.description.trim() ? <p>{item.description}</p> : null}
            </article>
          ))}
        </div>
      );
    case "certifications":
      return (
        <div className="cert-list">
          {data.certifications.map((item) => (
            <article key={item.id}>
              <h3>{item.name}</h3>
              <Details>
                {[item.issuer, formatThemeDate(item.issueDate)].filter(Boolean).join(" · ")}
              </Details>
              {item.expiryDate.trim() ? (
                <Details>Expires {formatThemeDate(item.expiryDate)}</Details>
              ) : null}
              {item.credentialId.trim() ? <Details>Credential {item.credentialId}</Details> : null}
              <ExternalLink href={item.credentialUrl} label="View credential" />
            </article>
          ))}
        </div>
      );
    case "languages":
      return (
        <div className="chips language-chips" role="list">
          {data.languages.map((item) => (
            <span key={item.id} role="listitem">
              {item.name}
              {item.proficiency.trim() ? ` / ${item.proficiency}` : ""}
            </span>
          ))}
        </div>
      );
    case "interests":
      return (
        <div aria-label="Interests" className="interest-list" role="list">
          {data.interests.filter((item) => item.trim()).map((item, index) => (
            <span key={`${item}-${index}`} role="listitem">{item}</span>
          ))}
        </div>
      );
    case "customSections":
      return (
        <div className="custom-sections">
          {data.customSections.map((group) => (
            <article key={group.id}>
              <h3>{group.title || "Additional details"}</h3>
              {group.items.map((item) => (
                <div className="custom-item" key={item.id}>
                  <p className="item-date">{item.date}</p>
                  <strong>{item.title}</strong>
                  {item.subtitle.trim() ? <span>{item.subtitle}</span> : null}
                  {item.description.trim() ? <p>{item.description}</p> : null}
                </div>
              ))}
            </article>
          ))}
        </div>
      );
  }
}

export function OrderedSections({
  compact = false,
  config,
  data,
  flavor,
  slots,
}: {
  compact?: boolean;
  config: ThemeConfig;
  data: PortfolioData;
  flavor: ThemeFlavor;
  slots?: Partial<Record<PortfolioSectionKey, ReactNode>>;
}) {
  const sections = getVisibleThemeSections(data, config);

  return (
    <>
      {sections.map((section, index) => (
        <div className="section-slot" data-section-key={section} key={section}>
          {slots?.[section] ?? (
            <section
              className={`portfolio-section ${compact ? "section-compact" : ""}`}
              id={section}
            >
              <SectionTitle flavor={flavor} index={compact ? undefined : index}>
                {SECTION_LABELS[section]}
              </SectionTitle>
              <SectionContent data={data} flavor={flavor} section={section} />
            </section>
          )}
        </div>
      ))}
    </>
  );
}
