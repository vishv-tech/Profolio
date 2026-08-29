import type { LinkItem, LinkType } from "@/types/portfolio";

export type ResumeSourceLink = Omit<LinkItem, "id">;

type PdfTextItem = {
  height?: number;
  str: string;
  transform?: number[];
  width?: number;
};

type PdfAnnotation = {
  contentsObj?: { str?: unknown };
  rect?: unknown;
  titleObj?: { str?: unknown };
  unsafeUrl?: unknown;
  url?: unknown;
};

type LinkCandidate = {
  label?: string;
  type?: LinkType;
  url: string;
};

type IdFactory = () => string;

const KNOWN_LINK_LABELS: Record<Exclude<LinkType, "other">, string> = {
  behance: "Behance",
  dribbble: "Dribbble",
  github: "GitHub",
  linkedin: "LinkedIn",
  medium: "Medium",
  portfolio: "Portfolio",
  youtube: "YouTube",
};

const URL_WITH_SCHEME_OR_WWW = /(?:https?:\/\/|www\.)[^\s<>"']+/giu;
const BARE_DOMAIN =
  /(?<![@\p{L}\p{N}_-])(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+(?:design|tech|site|app|com|net|org|dev|io|me|co|in|ai)(?![\p{L}\p{N}-])(?:\/[^\s<>"']*)?/giu;

function cleanUrlCandidate(value: string) {
  return value
    .replace(/[\u200b-\u200d\ufeff]/gu, "")
    .trim()
    .replace(/[.,;:!?\])}]+$/gu, "");
}

function isNonPublicIpv4(hostname: string) {
  const parts = hostname.split(".").map(Number);

  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }

  return (
    parts[0] === 0 ||
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] >= 224
  );
}

function isExternalHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/gu, "");
  const localSuffixes = [
    ".example",
    ".home",
    ".internal",
    ".invalid",
    ".lan",
    ".local",
    ".localdomain",
    ".localhost",
    ".test",
  ];

  if (
    !normalized ||
    normalized === "localhost" ||
    localSuffixes.some((suffix) => normalized.endsWith(suffix)) ||
    isNonPublicIpv4(normalized)
  ) {
    return false;
  }

  if (normalized.includes(":")) {
    const withoutSeparators = normalized.replace(/:/gu, "");
    const significantDigits = withoutSeparators.replace(/^0+/u, "");

    return !(
      significantDigits === "" ||
      significantDigits === "1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe") ||
      normalized.startsWith("ff") ||
      normalized.includes("ffff:")
    );
  }

  return normalized.includes(".");
}

export function normalizeExternalUrl(value: string) {
  const cleaned = cleanUrlCandidate(value);

  if (!cleaned) {
    return null;
  }

  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//iu.test(cleaned)
    ? cleaned
    : `https://${cleaned}`;

  try {
    const url = new URL(withProtocol);

    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username ||
      url.password ||
      !isExternalHostname(url.hostname)
    ) {
      return null;
    }

    url.hostname = url.hostname.replace(/^www\./u, "");
    return url.toString();
  } catch {
    return null;
  }
}

function hasHostname(hostname: string, expected: string) {
  return hostname === expected || hostname.endsWith(`.${expected}`);
}

export function classifyResumeLink(
  urlValue: string,
  preferredType: LinkType = "other",
  labelHint = "",
): LinkType {
  const normalizedUrl = normalizeExternalUrl(urlValue);

  if (!normalizedUrl) {
    return "other";
  }

  const url = new URL(normalizedUrl);
  const hostname = url.hostname.toLowerCase().replace(/^www\./u, "");

  if (hasHostname(hostname, "linkedin.com")) return "linkedin";
  if (hasHostname(hostname, "github.com")) return "github";
  if (hasHostname(hostname, "behance.net")) return "behance";
  if (hasHostname(hostname, "dribbble.com")) return "dribbble";
  if (hasHostname(hostname, "medium.com")) return "medium";
  if (hasHostname(hostname, "youtube.com") || hostname === "youtu.be") {
    return "youtube";
  }

  if (
    preferredType === "portfolio" ||
    /\b(?:personal\s+(?:site|website)|portfolio)\b/iu.test(labelHint) ||
    /(?:^|[.-])portfolio(?:[.-]|$)/iu.test(hostname)
  ) {
    return "portfolio";
  }

  return "other";
}

function labelForLink(type: LinkType, normalizedUrl: string) {
  if (type !== "other") {
    return KNOWN_LINK_LABELS[type];
  }

  try {
    return new URL(normalizedUrl).hostname.toLowerCase().replace(/^www\./u, "");
  } catch {
    return "Website";
  }
}

export function createResumeSourceLink(
  candidate: LinkCandidate,
): ResumeSourceLink | null {
  const url = normalizeExternalUrl(candidate.url);

  if (!url) {
    return null;
  }

  const type = classifyResumeLink(
    url,
    candidate.type ?? "other",
    candidate.label,
  );

  return {
    label: labelForLink(type, url),
    type,
    url,
  };
}

function isPdfTextItem(value: unknown): value is PdfTextItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "str" in value &&
    typeof value.str === "string"
  );
}

function annotationTextHint(
  annotation: PdfAnnotation,
  items: readonly unknown[],
) {
  const rect = Array.isArray(annotation.rect) ? annotation.rect : null;

  if (
    rect?.length === 4 &&
    rect.every((value) => typeof value === "number" && Number.isFinite(value))
  ) {
    const [left, bottom, right, top] = rect as number[];
    const matchingText = items
      .filter(isPdfTextItem)
      .filter((item) => {
        const transform = item.transform;

        if (!transform || transform.length < 6) {
          return false;
        }

        const x = transform[4];
        const y = transform[5];
        const width = Math.abs(item.width ?? 0);
        const height = Math.abs(item.height ?? 0);

        return (
          x <= right + 2 &&
          x + width >= left - 2 &&
          y + height >= bottom - 4 &&
          y - height <= top + 4
        );
      })
      .map((item) => item.str.trim())
      .filter(Boolean)
      .join(" ");

    if (matchingText) {
      return matchingText.slice(0, 80);
    }
  }

  const metadataHint = annotation.contentsObj?.str ?? annotation.titleObj?.str;
  return typeof metadataHint === "string"
    ? metadataHint.trim().slice(0, 80)
    : "";
}

export function extractLinksFromPdfAnnotations(
  annotations: readonly unknown[],
  textItems: readonly unknown[] = [],
) {
  const links: ResumeSourceLink[] = [];

  for (const value of annotations) {
    if (typeof value !== "object" || value === null) {
      continue;
    }

    const annotation = value as PdfAnnotation;
    const rawUrl = annotation.url ?? annotation.unsafeUrl;

    if (typeof rawUrl !== "string") {
      continue;
    }

    const link = createResumeSourceLink({
      label: annotationTextHint(annotation, textItems),
      url: rawUrl,
    });

    if (link) {
      links.push(link);
    }
  }

  return deduplicateResumeSourceLinks(links);
}

function deduplicationKey(urlValue: string) {
  const normalizedUrl = normalizeExternalUrl(urlValue);

  if (!normalizedUrl) {
    return null;
  }

  const url = new URL(normalizedUrl);

  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/u, "");
  }

  return url.toString();
}

export function deduplicateResumeSourceLinks(
  candidates: readonly LinkCandidate[],
) {
  const links: ResumeSourceLink[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const link = createResumeSourceLink(candidate);
    const key = link ? deduplicationKey(link.url) : null;

    if (!link || !key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    links.push(link);
  }

  return links;
}

export function extractVisibleResumeLinks(text: string) {
  const matches = [
    ...text.matchAll(URL_WITH_SCHEME_OR_WWW),
    ...text.matchAll(BARE_DOMAIN),
  ];

  return deduplicateResumeSourceLinks(
    matches.map((match) => ({ url: match[0] })),
  );
}

export function mergeResumeLinks(
  deterministicLinks: readonly ResumeSourceLink[],
  geminiLinks: readonly LinkCandidate[],
  createId: IdFactory,
) {
  return deduplicateResumeSourceLinks([
    ...deterministicLinks,
    ...geminiLinks,
  ]).map((link) => ({ id: createId(), ...link }));
}
