import type { LinkItem, LinkType } from "@/types/portfolio";

const LINK_LABELS: Readonly<Record<LinkType, string>> = {
  linkedin: "LinkedIn",
  github: "GitHub",
  portfolio: "Portfolio",
  behance: "Behance",
  dribbble: "Dribbble",
  medium: "Medium",
  youtube: "YouTube",
  other: "Website",
};

export function getThemeLinkLabel(link: LinkItem): string {
  return link.label.trim() || LINK_LABELS[link.type];
}

export function getSafeExternalUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function getSafeEmailUrl(value: string): string | null {
  const email = value.trim();
  return email && !/[\r\n]/.test(email)
    ? `mailto:${encodeURIComponent(email)}`
    : null;
}

export function getSafePhoneUrl(value: string): string | null {
  const phone = value.trim().replace(/[^+\d]/g, "");
  return phone ? `tel:${phone}` : null;
}
