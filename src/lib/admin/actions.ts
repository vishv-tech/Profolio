"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  assertAccountStatusChangeAllowed,
  assertRoleChangeAllowed,
} from "@/lib/admin/mutation-policy";
import { requireAdmin } from "@/lib/admin/require-admin";
import {
  accountStatusChangeSchema,
  parseThemeForm,
  roleChangeSchema,
  themeIdSchema,
} from "@/lib/admin/validation";
import { toDatabaseJson } from "@/lib/resumes/json";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  planCodedThemeMetadataSync,
  type ThemeMetadataRow,
} from "@/lib/themes/metadata";
import { getThemeManifest } from "@/themes/registry";
import type { AccountStatus, UserRole } from "@/types/admin";

const SAFE_ERRORS = [
  "At least one active administrator must remain.",
  "You cannot suspend your own account.",
  "You cannot remove your own admin role.",
  "This theme is referenced and cannot be deleted.",
  "Theme configuration must be valid JSON.",
  "Unsupported theme layout.",
  "Only HTTPS preview URLs are allowed.",
  "The selected account no longer exists.",
  "Theme metadata already exists for this layout.",
  "Duplicate theme metadata must be resolved before this action.",
  "Only installed coded themes can be managed.",
] as const;

function finish(
  path: string,
  kind: "success" | "error",
  message: string,
): never {
  const query = new URLSearchParams({ [kind]: message });
  redirect(`${path}?${query}`);
}

function safeFailure(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Invalid input.";
  }

  if (error instanceof Error) {
    return (
      SAFE_ERRORS.find((message) => error.message.includes(message)) ??
      "Operation failed. Please try again."
    );
  }

  return "Operation failed. Please try again.";
}

async function targetAccount(targetId: string) {
  const client = createAdminClient();
  const [target, activeAdmins] = await Promise.all([
    client
      .from("profiles")
      .select("id, role, account_status")
      .eq("id", targetId)
      .maybeSingle(),
    client
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("account_status", "active"),
  ]);

  if (target.error || !target.data) {
    throw new Error("The selected account no longer exists.");
  }
  if (activeAdmins.error) throw new Error("Unable to verify administrators.");

  const role: UserRole = target.data.role === "admin" ? "admin" : "user";
  const status: AccountStatus =
    target.data.account_status === "suspended" ? "suspended" : "active";

  return {
    client,
    role,
    status,
    activeAdminCount: activeAdmins.count ?? 0,
  };
}

export async function setAccountStatus(formData: FormData): Promise<never> {
  const admin = await requireAdmin();

  try {
    const input = accountStatusChangeSchema.parse({
      userId: formData.get("userId"),
      accountStatus: formData.get("accountStatus"),
    });
    const target = await targetAccount(input.userId);

    assertAccountStatusChangeAllowed(
      {
        actorId: admin.userId,
        targetId: input.userId,
        targetRole: target.role,
        targetStatus: target.status,
        activeAdminCount: target.activeAdminCount,
      },
      input.accountStatus,
    );

    const { data, error } = await target.client
      .from("profiles")
      .update({ account_status: input.accountStatus })
      .eq("id", input.userId)
      .select("id")
      .single();

    if (error || !data) throw new Error("Unable to update account status.");
  } catch (error) {
    finish("/admin/users", "error", safeFailure(error));
  }

  revalidatePath("/admin/users");
  finish("/admin/users", "success", "Account status updated.");
}

export async function changeUserRole(formData: FormData): Promise<never> {
  const admin = await requireAdmin();

  try {
    const input = roleChangeSchema.parse({
      userId: formData.get("userId"),
      role: formData.get("role"),
    });
    const target = await targetAccount(input.userId);

    assertRoleChangeAllowed(
      {
        actorId: admin.userId,
        targetId: input.userId,
        targetRole: target.role,
        targetStatus: target.status,
        activeAdminCount: target.activeAdminCount,
      },
      input.role,
    );

    const { data, error } = await target.client
      .from("profiles")
      .update({ role: input.role })
      .eq("id", input.userId)
      .select("id")
      .single();

    if (error || !data) throw new Error("Unable to update the account role.");
  } catch (error) {
    finish("/admin/users", "error", safeFailure(error));
  }

  revalidatePath("/admin/users");
  finish("/admin/users", "success", "Account role updated.");
}

function themeRecord(input: ReturnType<typeof parseThemeForm>) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    layout_key: input.layoutKey,
    preview_image_url: input.previewImageUrl,
    default_config: toDatabaseJson(input.defaultConfig),
    is_active: input.isActive,
  };
}

export async function createTheme(formData: FormData): Promise<never> {
  await requireAdmin();

  try {
    const input = parseThemeForm(formData);
    const client = createAdminClient();
    const { count, error: duplicateError } = await client
      .from("themes")
      .select("id", { count: "exact", head: true })
      .eq("layout_key", input.layoutKey);

    if (duplicateError) throw new Error("Unable to verify theme metadata.");
    if ((count ?? 0) > 0) {
      throw new Error("Theme metadata already exists for this layout.");
    }

    const { error } = await client
      .from("themes")
      .insert(themeRecord(input));

    if (error) throw new Error("Unable to create the theme.");
  } catch (error) {
    finish("/admin/themes", "error", safeFailure(error));
  }

  revalidatePath("/admin/themes");
  revalidatePath("/themes");
  finish("/admin/themes", "success", "Theme created.");
}

export async function updateTheme(formData: FormData): Promise<never> {
  await requireAdmin();

  try {
    const input = parseThemeForm(formData);
    if (!input.id) throw new Error("Invalid theme.");

    const client = createAdminClient();
    const { data: matchingRows, error: duplicateError } = await client
      .from("themes")
      .select("id")
      .eq("layout_key", input.layoutKey);

    if (duplicateError) throw new Error("Unable to verify theme metadata.");
    if (
      matchingRows.length > 1 ||
      (matchingRows.length === 1 && matchingRows[0].id !== input.id)
    ) {
      throw new Error("Theme metadata already exists for this layout.");
    }

    const { data, error } = await client
      .from("themes")
      .update(themeRecord(input))
      .eq("id", input.id)
      .select("id")
      .single();

    if (error || !data) throw new Error("Unable to update the theme.");
  } catch (error) {
    finish("/admin/themes", "error", safeFailure(error));
  }

  revalidatePath("/admin/themes");
  revalidatePath("/themes");
  finish("/admin/themes", "success", "Theme updated.");
}

export async function setThemeActive(formData: FormData): Promise<never> {
  await requireAdmin();

  try {
    const { themeId } = themeIdSchema.parse({ themeId: formData.get("themeId") });
    const isActive = z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .parse(formData.get("isActive"));
    const client = createAdminClient();
    const { data: selected, error: selectedError } = await client
      .from("themes")
      .select("id, layout_key")
      .eq("id", themeId)
      .maybeSingle();

    if (selectedError || !selected || !getThemeManifest(selected.layout_key)) {
      throw new Error("Only installed coded themes can be managed.");
    }

    const { count, error: duplicateError } = await client
      .from("themes")
      .select("id", { count: "exact", head: true })
      .eq("layout_key", selected.layout_key);

    if (duplicateError) throw new Error("Unable to verify theme metadata.");
    if (count !== 1) {
      throw new Error("Duplicate theme metadata must be resolved before this action.");
    }

    const { data, error } = await client
      .from("themes")
      .update({ is_active: isActive })
      .eq("id", themeId)
      .select("id")
      .single();

    if (error || !data) throw new Error("Unable to update the theme status.");
  } catch (error) {
    finish("/admin/themes", "error", safeFailure(error));
  }

  revalidatePath("/admin/themes");
  revalidatePath("/themes");
  finish("/admin/themes", "success", "Theme availability updated.");
}

export async function deleteTheme(formData: FormData): Promise<never> {
  await requireAdmin();

  try {
    const { themeId } = themeIdSchema.parse({ themeId: formData.get("themeId") });
    const client = createAdminClient();
    const [selected, portfolios, deployments] = await Promise.all([
      client
        .from("themes")
        .select("id, layout_key")
        .eq("id", themeId)
        .maybeSingle(),
      client
        .from("portfolios")
        .select("id", { count: "exact", head: true })
        .eq("theme_id", themeId),
      client
        .from("deployments")
        .select("id", { count: "exact", head: true })
        .eq("theme_id", themeId),
    ]);

    if (
      selected.error ||
      !selected.data ||
      !getThemeManifest(selected.data.layout_key)
    ) {
      throw new Error("Only installed coded themes can be managed.");
    }
    if (portfolios.error || deployments.error) {
      throw new Error("Unable to verify theme usage.");
    }
    if ((portfolios.count ?? 0) > 0 || (deployments.count ?? 0) > 0) {
      throw new Error("This theme is referenced and cannot be deleted.");
    }

    const { data, error } = await client
      .from("themes")
      .delete()
      .eq("id", themeId)
      .select("id")
      .single();

    if (error || !data) throw new Error("Unable to delete the theme.");
  } catch (error) {
    finish("/admin/themes", "error", safeFailure(error));
  }

  revalidatePath("/admin/themes");
  revalidatePath("/themes");
  finish("/admin/themes", "success", "Theme deleted.");
}

export async function syncCodedThemes(): Promise<never> {
  await requireAdmin();

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let issues = 0;

  try {
    const client = createAdminClient();
    const { data, error } = await client
      .from("themes")
      .select(
        "id, name, slug, description, layout_key, preview_image_url, default_config, is_active, created_at, updated_at",
      );

    if (error) throw new Error("Unable to load theme metadata.");

    const plan = planCodedThemeMetadataSync((data ?? []) as ThemeMetadataRow[]);
    unchanged = plan.unchanged.length;
    issues = plan.issues.length;

    for (const operation of plan.operations) {
      if (operation.kind === "insert") {
        const { error: insertError } = await client.from("themes").insert({
          ...operation.record,
          default_config: toDatabaseJson(operation.record.default_config),
        });

        if (insertError) throw new Error("Unable to synchronize theme metadata.");
        created += 1;
      } else {
        const { data: synchronized, error: updateError } = await client
          .from("themes")
          .update({
            ...operation.record,
            default_config: toDatabaseJson(operation.record.default_config),
          })
          .eq("id", operation.id)
          .eq("layout_key", operation.layoutKey)
          .select("id")
          .single();

        if (updateError || !synchronized) {
          throw new Error("Unable to synchronize theme metadata.");
        }
        updated += 1;
      }
    }
  } catch (error) {
    finish("/admin/themes", "error", safeFailure(error));
  }

  revalidatePath("/admin/themes");
  revalidatePath("/themes");
  finish(
    "/admin/themes",
    "success",
    `Theme sync complete: ${created} created, ${updated} updated, ${unchanged} unchanged${
      issues ? `, ${issues} require review` : ""
    }.`,
  );
}
