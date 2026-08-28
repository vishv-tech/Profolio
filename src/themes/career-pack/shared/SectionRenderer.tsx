import type { ReactNode } from "react";

import type { PortfolioData } from "@/types/portfolio";
import type { PortfolioSectionKey } from "@/types/theme";

import { SECTION_LABELS } from "./data";
import { formatThemeDate, formatThemeDateRange } from "./dates";
import { getSafeExternalUrl } from "./links";

interface SectionRendererProps {
  className?: string;
  data: PortfolioData;
  sectionKey: PortfolioSectionKey;
}

function Details({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm leading-6" style={{ color: "var(--career-muted)" }}>
      {children}
    </p>
  );
}

function Highlights({ items }: { items: string[] }) {
  const visibleItems = items.filter((item) => item.trim());
  return visibleItems.length ? (
    <ul className="list-disc space-y-1 pl-5 text-sm leading-6">
      {visibleItems.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  ) : null;
}

function Tags({ items }: { items: string[] }) {
  const visibleItems = items.filter((item) => item.trim());
  return visibleItems.length ? (
    <ul className="flex flex-wrap gap-2" aria-label="Tags">
      {visibleItems.map((item) => (
        <li
          className="rounded-full border px-2.5 py-1 text-xs"
          key={item}
          style={{ borderColor: "var(--career-border)" }}
        >
          {item}
        </li>
      ))}
    </ul>
  ) : null;
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  const safeUrl = getSafeExternalUrl(href);
  return safeUrl ? (
    <a
      className="text-sm font-medium underline underline-offset-4"
      href={safeUrl}
      rel="noreferrer noopener"
      target="_blank"
    >
      {label}
    </a>
  ) : null;
}

export function SectionRenderer({
  className = "",
  data,
  sectionKey,
}: SectionRendererProps) {
  let content: ReactNode = null;

  switch (sectionKey) {
    case "summary":
      content = <p className="whitespace-pre-line leading-7">{data.summary}</p>;
      break;
    case "experience":
      content = data.experience.map((item) => (
        <article className="space-y-2" key={item.id}>
          <div>
            <h3 className="font-semibold">{item.role || item.company}</h3>
            <Details>
              {[item.company, item.employmentType, item.location].filter(Boolean).join(" · ")}
            </Details>
            <Details>
              {formatThemeDateRange(item.startDate, item.endDate, item.isCurrent)}
            </Details>
          </div>
          {item.description.trim() ? <p className="text-sm leading-6">{item.description}</p> : null}
          <Highlights items={item.highlights} />
        </article>
      ));
      break;
    case "education":
      content = data.education.map((item) => (
        <article className="space-y-1" key={item.id}>
          <h3 className="font-semibold">{item.degree || item.institution}</h3>
          <Details>
            {[item.fieldOfStudy, item.institution, item.location].filter(Boolean).join(" · ")}
          </Details>
          <Details>{formatThemeDateRange(item.startDate, item.endDate)}</Details>
          {item.grade.trim() ? <Details>{item.grade}</Details> : null}
          {item.description.trim() ? <p className="text-sm leading-6">{item.description}</p> : null}
        </article>
      ));
      break;
    case "projects":
      content = data.projects.map((item) => (
        <article className="space-y-2" key={item.id}>
          <h3 className="font-semibold">{item.name || "Project"}</h3>
          <Details>{formatThemeDateRange(item.startDate, item.endDate)}</Details>
          {item.description.trim() ? <p className="text-sm leading-6">{item.description}</p> : null}
          <Highlights items={item.highlights} />
          <Tags items={item.technologies} />
          <div className="flex flex-wrap gap-3">
            <ExternalLink href={item.projectUrl} label="View project" />
            <ExternalLink href={item.githubUrl} label="View source" />
          </div>
        </article>
      ));
      break;
    case "skills":
      content = data.skills.map((group) => (
        <article className="space-y-2" key={group.id}>
          <h3 className="text-sm font-semibold">{group.category || "Skills"}</h3>
          <Tags items={group.items} />
        </article>
      ));
      break;
    case "achievements":
      content = data.achievements.map((item) => (
        <article className="space-y-1" key={item.id}>
          <h3 className="font-semibold">{item.title}</h3>
          <Details>{[item.issuer, formatThemeDate(item.date)].filter(Boolean).join(" · ")}</Details>
          {item.description.trim() ? <p className="text-sm leading-6">{item.description}</p> : null}
        </article>
      ));
      break;
    case "certifications":
      content = data.certifications.map((item) => (
        <article className="space-y-1" key={item.id}>
          <h3 className="font-semibold">{item.name}</h3>
          <Details>
            {[item.issuer, formatThemeDate(item.issueDate)].filter(Boolean).join(" · ")}
          </Details>
          {item.expiryDate.trim() ? <Details>Expires {formatThemeDate(item.expiryDate)}</Details> : null}
          {item.credentialId.trim() ? <Details>Credential {item.credentialId}</Details> : null}
          <ExternalLink href={item.credentialUrl} label="View credential" />
        </article>
      ));
      break;
    case "languages":
      content = (
        <ul className="space-y-2">
          {data.languages.map((item) => (
            <li className="flex justify-between gap-4 text-sm" key={item.id}>
              <span>{item.name}</span>
              <span style={{ color: "var(--career-muted)" }}>{item.proficiency}</span>
            </li>
          ))}
        </ul>
      );
      break;
    case "interests":
      content = <Tags items={data.interests} />;
      break;
    case "customSections":
      content = data.customSections.map((section) => (
        <article className="space-y-3" key={section.id}>
          <h3 className="font-semibold">{section.title || "Additional details"}</h3>
          {section.items.map((item) => (
            <div className="space-y-1" key={item.id}>
              <h4 className="text-sm font-medium">{item.title}</h4>
              <Details>{[item.subtitle, item.date].filter(Boolean).join(" · ")}</Details>
              {item.description.trim() ? <p className="text-sm leading-6">{item.description}</p> : null}
            </div>
          ))}
        </article>
      ));
  }

  return (
    <section className={`space-y-4 ${className}`}>
      <h2
        className="text-xs font-semibold uppercase tracking-[0.2em]"
        style={{ color: "var(--career-accent)", fontFamily: "var(--career-heading-font)" }}
      >
        {SECTION_LABELS[sectionKey]}
      </h2>
      <div className="space-y-5">{content}</div>
    </section>
  );
}
