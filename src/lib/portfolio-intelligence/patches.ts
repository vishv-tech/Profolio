import {
  ContentImprovementPatchSchema,
  ContentImprovementTargetSchema,
  type ContentImprovementPatch,
  type ContentImprovementTarget,
} from "@/lib/portfolio-intelligence/schemas";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";
import type { PortfolioData } from "@/types/portfolio";

type PatchResult =
  | { success: true; data: PortfolioData }
  | { success: false; reason: "invalid-patch" | "invalid-target" | "stale" };

type DescriptionItem = {
  id: string;
  description: string;
  highlights?: string[];
};

function findUniqueById<T extends { id: string }>(items: readonly T[], id: string) {
  const matches = items.filter((item) => item.id === id);
  return matches.length === 1 ? matches[0] : null;
}

export function readContentImprovementTarget(
  data: PortfolioData,
  targetValue: unknown,
): string | null {
  const targetSource =
    typeof targetValue === "object" && targetValue !== null
      ? {
          section: Reflect.get(targetValue, "section"),
          itemId: Reflect.get(targetValue, "itemId"),
          field: Reflect.get(targetValue, "field"),
          listIndex: Reflect.get(targetValue, "listIndex"),
          original: Reflect.get(targetValue, "original"),
        }
      : targetValue;
  const target = ContentImprovementTargetSchema.safeParse(targetSource);

  if (!target.success) {
    return null;
  }

  if (target.data.section === "summary") return data.summary;
  if (target.data.section === "personal") return data.personal.headline;

  if (target.data.section === "customSections") {
    const items = data.customSections.flatMap((section) => section.items);
    return findUniqueById(items, target.data.itemId!)?.description ?? null;
  }

  const collection: readonly DescriptionItem[] = data[target.data.section];
  const item = findUniqueById(collection, target.data.itemId!);

  if (!item) {
    return null;
  }

  if (target.data.field === "highlight") {
    return item.highlights?.[target.data.listIndex!] ?? null;
  }

  return "description" in item ? item.description : null;
}

export function targetMatchesCurrentDraft(
  data: PortfolioData,
  target: ContentImprovementTarget,
): boolean {
  return readContentImprovementTarget(data, target) === target.original;
}

export function applyContentImprovementPatch(
  data: PortfolioData,
  patchValue: unknown,
): PatchResult {
  const patch = ContentImprovementPatchSchema.safeParse(patchValue);

  if (!patch.success || patch.data.suggested === patch.data.original) {
    return { success: false, reason: "invalid-patch" };
  }

  const current = readContentImprovementTarget(data, patch.data);

  if (current === null) {
    return { success: false, reason: "invalid-target" };
  }

  if (current !== patch.data.original) {
    return { success: false, reason: "stale" };
  }

  const next = structuredClone(data);
  const value = patch.data.suggested;

  if (patch.data.section === "summary") {
    next.summary = value;
  } else if (patch.data.section === "personal") {
    next.personal.headline = value;
  } else if (patch.data.section === "customSections") {
    const item = findUniqueById(
      next.customSections.flatMap((section) => section.items),
      patch.data.itemId!,
    );
    if (!item) return { success: false, reason: "invalid-target" };
    item.description = value;
  } else {
    const collection: readonly DescriptionItem[] = next[patch.data.section];
    const item = findUniqueById(collection, patch.data.itemId!);
    if (!item) return { success: false, reason: "invalid-target" };

    if (patch.data.field === "highlight") {
      if (!item.highlights) return { success: false, reason: "invalid-target" };
      item.highlights[patch.data.listIndex!] = value;
    } else {
      item.description = value;
    }
  }

  const validated = PortfolioDataSchema.safeParse(next);
  return validated.success
    ? { success: true, data: validated.data }
    : { success: false, reason: "invalid-patch" };
}

export function createContentImprovementPatch(
  target: ContentImprovementTarget,
  suggestion: { suggested: string; reason: string },
): ContentImprovementPatch | null {
  const originalNumbers = new Set(
    target.original.match(/\d[\d,.:/%+-]*/g) ?? [],
  );
  const suggestedNumbers = suggestion.suggested.match(/\d[\d,.:/%+-]*/g) ?? [];

  if (suggestedNumbers.some((value) => !originalNumbers.has(value))) {
    return null;
  }

  const patch = ContentImprovementPatchSchema.safeParse({
    ...target,
    ...suggestion,
  });
  return patch.success ? patch.data : null;
}
