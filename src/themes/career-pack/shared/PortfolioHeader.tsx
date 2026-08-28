import type { PortfolioData } from "@/types/portfolio";
import type { ThemeConfig } from "@/types/theme";

import { getThemeInitials } from "./data";
import {
  getSafeEmailUrl,
  getSafeExternalUrl,
  getSafePhoneUrl,
  getThemeLinkLabel,
} from "./links";

interface PortfolioHeaderProps {
  className?: string;
  config: ThemeConfig;
  data: PortfolioData;
  imageClassName?: string;
  textAlign?: "left" | "center";
}

export function PortfolioHeader({
  className = "",
  config,
  data,
  imageClassName = "",
  textAlign = "left",
}: PortfolioHeaderProps) {
  const { personal } = data;
  const safeImageUrl = getSafeExternalUrl(personal.profileImageUrl);
  const contactItems = [
    config.visibility.showEmail && personal.email.trim()
      ? {
          href: getSafeEmailUrl(personal.email),
          label: personal.email.trim(),
        }
      : null,
    config.visibility.showPhone && personal.phone.trim()
      ? {
          href: getSafePhoneUrl(personal.phone),
          label: personal.phone.trim(),
        }
      : null,
    config.visibility.showLocation && personal.location.trim()
      ? { href: null, label: personal.location.trim() }
      : null,
  ].filter((item): item is { href: string | null; label: string } => Boolean(item));

  const links = config.visibility.showLinks
    ? data.links
        .map((link) => ({
          href: getSafeExternalUrl(link.url),
          id: link.id,
          label: getThemeLinkLabel(link),
        }))
        .filter((link): link is typeof link & { href: string } => Boolean(link.href))
    : [];

  return (
    <header
      className={`${
        textAlign === "center" ? "items-center text-center" : "items-start text-left"
      } flex flex-col gap-4 ${className}`}
    >
      {config.visibility.showProfileImage ? (
        safeImageUrl ? (
          // Portfolio images are user-configured remote URLs, so Next Image cannot
          // know their hosts at build time.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`${personal.fullName || "Portfolio"} profile`}
            className={`size-20 rounded-full border object-cover ${imageClassName}`}
            src={safeImageUrl}
            style={{ borderColor: "var(--career-border)" }}
          />
        ) : (
          <span
            aria-label={`${personal.fullName || "Portfolio"} initials`}
            className={`grid size-20 place-items-center rounded-full border text-xl font-semibold ${imageClassName}`}
            style={{
              background: "var(--career-surface)",
              borderColor: "var(--career-border)",
            }}
          >
            {getThemeInitials(personal.fullName)}
          </span>
        )
      ) : null}

      <div className="space-y-2">
        <h1
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
          style={{ fontFamily: "var(--career-heading-font)" }}
        >
          {personal.fullName || "Untitled portfolio"}
        </h1>
        {personal.headline.trim() ? (
          <p className="text-base sm:text-lg" style={{ color: "var(--career-muted)" }}>
            {personal.headline}
          </p>
        ) : null}
      </div>

      {contactItems.length ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label="Contact details">
          {contactItems.map((item) => (
            <li key={`${item.label}-${item.href ?? "text"}`}>
              {item.href ? <a href={item.href}>{item.label}</a> : item.label}
            </li>
          ))}
        </ul>
      ) : null}

      {links.length ? (
        <nav aria-label="Portfolio links" className="flex flex-wrap gap-3 text-sm">
          {links.map((link) => (
            <a
              className="underline decoration-current/40 underline-offset-4"
              href={link.href}
              key={link.id}
              rel="noreferrer noopener"
              target="_blank"
            >
              {link.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
