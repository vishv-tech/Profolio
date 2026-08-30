import { z } from "zod";

import { ThemeConfigSchema } from "@/lib/validation/theme";
import { allThemePack } from "@/themes/registry";
import type { ThemeConfig } from "@/types/theme";

const httpsUrl = z
  .url()
  .refine((value) => new URL(value).protocol === "https:", {
    message: "Only HTTPS preview URLs are allowed.",
  });

export const userIdSchema = z.strictObject({ userId: z.uuid() });
export const roleChangeSchema = userIdSchema.extend({
  role: z.enum(["user", "admin"]),
});
export const accountStatusChangeSchema = userIdSchema.extend({
  accountStatus: z.enum(["active", "suspended"]),
});
export const themeIdSchema = z.strictObject({ themeId: z.uuid() });

export function supportedLayoutKeys(): string[] {
  return allThemePack.map((theme) => theme.layoutKey);
}

export type ThemeInput = {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  layoutKey: string;
  previewImageUrl: string | null;
  defaultConfig: ThemeConfig;
  isActive: boolean;
};

export function parseThemeForm(formData: FormData): ThemeInput {
  let config: unknown;

  try {
    config = JSON.parse(String(formData.get("defaultConfig") ?? ""));
  } catch {
    throw new Error("Theme configuration must be valid JSON.");
  }

  const layoutKey = z.string().trim().parse(formData.get("layoutKey"));

  if (!supportedLayoutKeys().includes(layoutKey)) {
    throw new Error("Unsupported theme layout.");
  }

  const parsed = z
    .strictObject({
      id: z.uuid().optional(),
      name: z.string().trim().min(2).max(80),
      slug: z
        .string()
        .trim()
        .max(100)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      description: z.string().trim().max(500).nullable(),
      previewImageUrl: httpsUrl.nullable(),
      defaultConfig: ThemeConfigSchema,
      isActive: z.boolean(),
    })
    .parse({
      id: formData.get("id") || undefined,
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description") || null,
      previewImageUrl: formData.get("previewImageUrl") || null,
      defaultConfig: config,
      isActive: formData.get("isActive") === "on",
    });

  return { ...parsed, layoutKey };
}
