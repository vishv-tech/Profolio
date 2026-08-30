import "server-only";

import type { ProfilePhotoCandidate } from "@/lib/profile-media/types";
import {
  createResumeCandidatePrefix,
  parseResumeCandidateName,
  PROFILE_PHOTO_BUCKET,
} from "@/lib/profile-media/validation";
import type { ResumeProfileMediaResult } from "@/lib/resumes/media";
import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

function toPublicCandidate(
  supabase: ServerSupabaseClient,
  path: string,
  name: string,
): ProfilePhotoCandidate | null {
  const metadata = parseResumeCandidateName(name);
  if (!metadata) return null;

  const { data } = supabase.storage.from(PROFILE_PHOTO_BUCKET).getPublicUrl(path);
  return { ...metadata, path, url: data.publicUrl };
}

export async function storeResumeProfileCandidates(
  userId: string,
  resumeId: string,
  media: ResumeProfileMediaResult,
  providedClient?: ServerSupabaseClient,
) {
  const supabase = providedClient ?? (await createClient());
  const prefix = createResumeCandidatePrefix(userId, resumeId);
  const candidates: ProfilePhotoCandidate[] = [];
  let automaticProfileImageUrl = "";

  for (const candidate of media.candidates) {
    const name = `p${candidate.pageNumber}-w${candidate.width}-h${candidate.height}-s${candidate.score}-${crypto.randomUUID()}.png`;
    const path = `${prefix}/${name}`;
    const { error } = await supabase.storage
      .from(PROFILE_PHOTO_BUCKET)
      .upload(path, candidate.bytes, {
        cacheControl: "31536000",
        contentType: candidate.contentType,
        upsert: false,
      });

    if (error) continue;
    const publicCandidate = toPublicCandidate(supabase, path, name);
    if (!publicCandidate) continue;

    candidates.push(publicCandidate);
    if (candidate.fingerprint === media.automaticCandidateFingerprint) {
      automaticProfileImageUrl = publicCandidate.url;
    }
  }

  return { automaticProfileImageUrl, candidates };
}

export async function listResumeProfileCandidates(
  userId: string,
  resumeId: string,
  providedClient?: ServerSupabaseClient,
): Promise<ProfilePhotoCandidate[]> {
  const supabase = providedClient ?? (await createClient());
  const prefix = createResumeCandidatePrefix(userId, resumeId);
  const { data, error } = await supabase.storage
    .from(PROFILE_PHOTO_BUCKET)
    .list(prefix, { limit: 20, sortBy: { column: "name", order: "asc" } });

  if (error) return [];

  return (data ?? []).flatMap((object) => {
    const path = `${prefix}/${object.name}`;
    const candidate = toPublicCandidate(supabase, path, object.name);
    return candidate ? [candidate] : [];
  });
}
