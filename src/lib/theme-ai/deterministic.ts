import {
  ThemeStylePatchSchema,
  type ThemeAiResponse,
  type ThemeStylePatch,
} from "./schema";

type NamedColor =
  | "beige"
  | "black"
  | "blue"
  | "dark blue"
  | "gray"
  | "green"
  | "navy"
  | "orange"
  | "pink"
  | "purple"
  | "red"
  | "white";

const COLOR_PATTERN =
  "dark\\s+blue|navy|black|white|gr(?:a|e)y|purple|pink|green|orange|beige|red|blue";

const COLOR_VALUES: Readonly<Record<NamedColor, string>> = {
  beige: "#f5f0e6",
  black: "#09090b",
  blue: "#2563eb",
  "dark blue": "#1e3a8a",
  gray: "#6b7280",
  green: "#15803d",
  navy: "#0f172a",
  orange: "#c2410c",
  pink: "#db2777",
  purple: "#7e22ce",
  red: "#b91c1c",
  white: "#ffffff",
};

const BACKGROUND_PALETTES: Readonly<
  Record<NamedColor, ThemeStylePatch>
> = {
  beige: {
    colorMode: "light",
    backgroundColor: "#f5f0e6",
    surfaceColor: "#fffaf0",
    textColor: "#292524",
    mutedTextColor: "#57534e",
    borderColor: "#d6d3d1",
  },
  black: {
    colorMode: "dark",
    backgroundColor: "#09090b",
    surfaceColor: "#18181b",
    textColor: "#fafafa",
    mutedTextColor: "#d4d4d8",
    borderColor: "#3f3f46",
  },
  blue: {
    colorMode: "dark",
    backgroundColor: "#1e3a8a",
    surfaceColor: "#1e40af",
    textColor: "#ffffff",
    mutedTextColor: "#dbeafe",
    borderColor: "#60a5fa",
  },
  "dark blue": {
    colorMode: "dark",
    backgroundColor: "#172554",
    surfaceColor: "#1e3a8a",
    textColor: "#ffffff",
    mutedTextColor: "#bfdbfe",
    borderColor: "#3b82f6",
  },
  gray: {
    colorMode: "dark",
    backgroundColor: "#111827",
    surfaceColor: "#1f2937",
    textColor: "#f9fafb",
    mutedTextColor: "#d1d5db",
    borderColor: "#4b5563",
  },
  green: {
    colorMode: "dark",
    backgroundColor: "#14532d",
    surfaceColor: "#166534",
    textColor: "#f0fdf4",
    mutedTextColor: "#bbf7d0",
    borderColor: "#22c55e",
  },
  navy: {
    colorMode: "dark",
    backgroundColor: "#0f172a",
    surfaceColor: "#1e293b",
    textColor: "#f8fafc",
    mutedTextColor: "#cbd5e1",
    borderColor: "#475569",
  },
  orange: {
    colorMode: "dark",
    backgroundColor: "#7c2d12",
    surfaceColor: "#9a3412",
    textColor: "#fff7ed",
    mutedTextColor: "#fed7aa",
    borderColor: "#f97316",
  },
  pink: {
    colorMode: "dark",
    backgroundColor: "#831843",
    surfaceColor: "#9d174d",
    textColor: "#fdf2f8",
    mutedTextColor: "#fbcfe8",
    borderColor: "#ec4899",
  },
  purple: {
    colorMode: "dark",
    backgroundColor: "#581c87",
    surfaceColor: "#6b21a8",
    textColor: "#faf5ff",
    mutedTextColor: "#e9d5ff",
    borderColor: "#a855f7",
  },
  red: {
    colorMode: "dark",
    backgroundColor: "#7f1d1d",
    surfaceColor: "#991b1b",
    textColor: "#ffffff",
    mutedTextColor: "#fecaca",
    borderColor: "#ef4444",
  },
  white: {
    colorMode: "light",
    backgroundColor: "#ffffff",
    surfaceColor: "#f8fafc",
    textColor: "#0f172a",
    mutedTextColor: "#475569",
    borderColor: "#e2e8f0",
  },
};

const PRESET_PATCHES: Readonly<Record<string, ThemeStylePatch>> = {
  "dark and modern": {
    ...BACKGROUND_PALETTES.navy,
    accentColor: "#3b82f6",
    animationIntensity: "subtle",
  },
  "larger headings": { headingScale: "large" },
  "minimal and clean": {
    colorMode: "light",
    backgroundColor: "#ffffff",
    surfaceColor: "#f8fafc",
    textColor: "#111827",
    mutedTextColor: "#6b7280",
    accentColor: "#111827",
    borderColor: "#e5e7eb",
    borderRadius: 8,
    spacing: "comfortable",
    animationIntensity: "none",
  },
  "more rounded": { borderRadius: 24 },
  "more spacious": { spacing: "spacious" },
  "professional blue": {
    colorMode: "light",
    backgroundColor: "#f8fafc",
    surfaceColor: "#ffffff",
    textColor: "#0f172a",
    mutedTextColor: "#475569",
    accentColor: "#2563eb",
    borderColor: "#cbd5e1",
    spacing: "comfortable",
  },
  "rounded cards": { borderRadius: 24 },
};

const FORBIDDEN_FALLBACK_TERMS =
  /\b(?:code|content|css|email|html|javascript|layout|link|phone|photo|publish|section|slug)\b/iu;

function normalizeInstruction(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/&/gu, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function namedColor(value: string): NamedColor {
  const normalized = value.replace(/\s+/gu, " ") as NamedColor | "grey";
  return normalized === "grey" ? "gray" : normalized;
}

function styleResponse(patch: ThemeStylePatch): ThemeAiResponse {
  return { kind: "style", patch: ThemeStylePatchSchema.parse(patch) };
}

export function interpretDeterministicThemeInstruction(
  instruction: string,
  options: { allowRecognizedSubset?: boolean } = {},
): ThemeAiResponse | null {
  const normalized = normalizeInstruction(instruction);
  const preset = PRESET_PATCHES[normalized];

  if (preset) return styleResponse(preset);
  if (!normalized || FORBIDDEN_FALLBACK_TERMS.test(normalized)) return null;

  let remaining = normalized;
  const patch: ThemeStylePatch = {};
  const consume = (
    expression: RegExp,
    apply: (match: RegExpExecArray) => void,
  ) => {
    remaining = remaining.replace(expression, (...values: unknown[]) => {
      const match = values.slice(0, -2) as string[];
      apply(Object.assign(match, { index: 0, input: remaining }) as RegExpExecArray);
      return " ";
    });
  };

  consume(/\b(?:use\s+)?dark\s+mode\b/giu, () => {
    Object.assign(patch, BACKGROUND_PALETTES.navy);
  });
  consume(/\b(?:use\s+)?light\s+mode\b/giu, () => {
    Object.assign(patch, BACKGROUND_PALETTES.white);
  });
  consume(/\b(?:make\s+(?:the\s+)?)?headings?\s+(?:larger|bigger)\b/giu, () => {
    patch.headingScale = "large";
  });
  consume(/\b(?:larger|bigger)\s+headings?\b/giu, () => {
    patch.headingScale = "large";
  });
  consume(/\b(?:make\s+(?:the\s+)?)?headings?\s+smaller\b/giu, () => {
    patch.headingScale = "small";
  });
  consume(/\bsmaller\s+headings?\b/giu, () => {
    patch.headingScale = "small";
  });
  consume(/\b(?:make\s+(?:it\s+)?)?more\s+rounded\b/giu, () => {
    patch.borderRadius = 24;
  });
  consume(/\b(?:make\s+(?:it\s+)?)?less\s+rounded\b/giu, () => {
    patch.borderRadius = 4;
  });
  consume(/\b(?:make\s+(?:it\s+)?)?more\s+spacious\b/giu, () => {
    patch.spacing = "spacious";
  });
  consume(/\b(?:make\s+(?:it|the\s+theme)\s+)?compact\b/giu, () => {
    patch.spacing = "compact";
  });
  consume(/\b(?:remove|disable)\s+(?:the\s+)?animations?\b/giu, () => {
    patch.animationIntensity = "none";
  });
  consume(/\bno\s+animations?\b/giu, () => {
    patch.animationIntensity = "none";
  });
  consume(/\b(?:use\s+)?subtle\s+animations?\b/giu, () => {
    patch.animationIntensity = "subtle";
  });

  consume(
    new RegExp(
      `\\b(?:(?:change|set|make)\\s+)?(?:the\\s+)?background(?:\\s+colou?r)?\\s+(?:to\\s+)?(${COLOR_PATTERN})\\b`,
      "giu",
    ),
    (match) => {
      Object.assign(patch, BACKGROUND_PALETTES[namedColor(match[1]!)]);
    },
  );
  consume(
    new RegExp(
      `\\b(?:use|make)\\s+(?:a\\s+)?(${COLOR_PATTERN})\\s+background\\b`,
      "giu",
    ),
    (match) => {
      Object.assign(patch, BACKGROUND_PALETTES[namedColor(match[1]!)]);
    },
  );
  consume(
    new RegExp(
      `\\b(?:(?:change|set|make)\\s+)?(?:the\\s+)?accent(?:\\s+colou?r)?\\s+(?:to\\s+)?(${COLOR_PATTERN})\\b`,
      "giu",
    ),
    (match) => {
      patch.accentColor = COLOR_VALUES[namedColor(match[1]!)];
    },
  );
  consume(
    new RegExp(
      `\\b(?:(?:change|set|make)\\s+)?(?:the\\s+)?text(?:\\s+colou?r)?\\s+(?:to\\s+)?(${COLOR_PATTERN})\\b`,
      "giu",
    ),
    (match) => {
      patch.textColor = COLOR_VALUES[namedColor(match[1]!)];
    },
  );

  if (Object.keys(patch).length === 0) return null;

  const unexplained = remaining
    .replace(/\b(?:also|and|please|the|then|theme|with)\b/giu, " ")
    .replace(/\s+/gu, " ")
    .trim();

  if (!options.allowRecognizedSubset && unexplained) return null;
  return styleResponse(patch);
}
