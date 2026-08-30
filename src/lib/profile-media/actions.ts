"use server";

import { z } from "zod";

import { requireActiveUser } from "@/lib/auth/guards";
import { listResumeProfileCandidates } from "@/lib/profile-media/resume-storage";
import type { ProfilePhotoScope } from "@/lib/profile-media/types";
import {
  createProfilePhotoStoragePath,
  getPortfolioAssetUrlOwnership,
  isOwnedResumeCandidatePath,
  PROFILE_PHOTO_BUCKET,
  validateProfileImageUpload,
} from "@/lib/profile-media/validation";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const ProfilePhotoScopeSchema = z.discriminatedUnion("kind", [
  z.strictObject({ id: z.string().uuid(), kind: z.literal("portfolio") }),
  z.strictObject({ id: z.string().uuid(), kind: z.literal("resume") }),
]);

export type ProfilePhotoMutationResult =
  | { success: true; url: string }
  | { success: false; message: string };

async function authorizePhotoScope(
  scopeValue: ProfilePhotoScope,
  userId: string,
) {
  const scope = ProfilePhotoScopeSchema.safeParse(scopeValue);
  if (!scope.success) return null;

  const supabase = await createClient();
  const result =
    scope.data.kind === "portfolio"
      ? await supabase
          .from("portfolios")
          .select("id")
          .eq("id", scope.data.id)
          .eq("user_id", userId)
          .maybeSingle()
      : await supabase
          .from("resumes")
          .select("id")
          .eq("id", scope.data.id)
          .eq("user_id", userId)
          .eq("status", "completed")
          .maybeSingle();

  return !result.error && result.data
    ? { scope: scope.data, supabase }
    : null;
}

export async function uploadProfilePhoto(
  scopeValue: ProfilePhotoScope,
  formData: FormData,
): Promise<ProfilePhotoMutationResult> {
  const user = await requireActiveUser();
  const authorization = await authorizePhotoScope(scopeValue, user.userId);
  if (!authorization) {
    return { success: false, message: "That portfolio photo is unavailable." };
  }

  const validation = await validateProfileImageUpload(formData.get("photo"));
  if (!validation.success) return validation;

  const path = createProfilePhotoStoragePath(
    user.userId,
    authorization.scope,
    validation.data.extension,
  );
  const { error } = await authorization.supabase.storage
    .from(PROFILE_PHOTO_BUCKET)
    .upload(path, validation.data.bytes, {
      cacheControl: "31536000",
      contentType: validation.data.contentType,
      upsert: false,
    });

  if (error) {
    return {
      success: false,
      message: "The profile photo could not be uploaded. Please try again.",
    };
  }

  const { data } = authorization.supabase.storage
    .from(PROFILE_PHOTO_BUCKET)
    .getPublicUrl(path);
  const ownership = getPortfolioAssetUrlOwnership(
    data.publicUrl,
    getSupabasePublicEnv().url,
    user.userId,
  );

  if (ownership !== "owned") {
    await authorization.supabase.storage.from(PROFILE_PHOTO_BUCKET).remove([path]);
    return {
      success: false,
      message: "The profile photo could not be prepared safely.",
    };
  }

  return { success: true, url: data.publicUrl };
}

export async function removeProfilePhotoReference(
  scopeValue: ProfilePhotoScope,
  currentUrl: string,
): Promise<ProfilePhotoMutationResult> {
  const user = await requireActiveUser();
  const authorization = await authorizePhotoScope(scopeValue, user.userId);
  if (!authorization) {
    return { success: false, message: "That portfolio photo is unavailable." };
  }

  const ownership = getPortfolioAssetUrlOwnership(
    currentUrl,
    getSupabasePublicEnv().url,
    user.userId,
  );

  if (ownership === "foreign") {
    return { success: false, message: "That portfolio photo is unavailable." };
  }

  // Clearing the draft reference is intentionally separate from deleting the
  // object. A published snapshot may still reference it until republishing.
  return { success: true, url: "" };
}

export async function selectExtractedProfilePhoto(
  resumeId: string,
  candidatePath: string,
): Promise<ProfilePhotoMutationResult> {
  const user = await requireActiveUser();
  const parsedResumeId = z.string().uuid().safeParse(resumeId);

  if (
    !parsedResumeId.success ||
    candidatePath.length > 500 ||
    !isOwnedResumeCandidatePath(candidatePath, user.userId, parsedResumeId.data)
  ) {
    return { success: false, message: "That resume photo is unavailable." };
  }

  const authorization = await authorizePhotoScope(
    { id: parsedResumeId.data, kind: "resume" },
    user.userId,
  );
  if (!authorization) {
    return { success: false, message: "That resume photo is unavailable." };
  }

  const candidates = await listResumeProfileCandidates(
    user.userId,
    parsedResumeId.data,
    authorization.supabase,
  );
  const candidate = candidates.find(({ path }) => path === candidatePath);

  return candidate
    ? { success: true, url: candidate.url }
    : { success: false, message: "That resume photo is unavailable." };
}
