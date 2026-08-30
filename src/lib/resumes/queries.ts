import "server-only";

import { z } from "zod";

import { requireActiveUser } from "@/lib/auth/guards";
import { listResumeProfileCandidates } from "@/lib/profile-media/resume-storage";
import { parseStoredPortfolio } from "@/lib/resumes/json";
import {
  RESUME_STATUSES,
  type ResumeWorkflowState,
} from "@/lib/resumes/types";
import { ResumeIdSchema } from "@/lib/resumes/validation";
import { createClient } from "@/lib/supabase/server";

const ResumeStatusSchema = z.enum(RESUME_STATUSES);

export async function getResumeWorkflowState(
  resumeId: string,
): Promise<ResumeWorkflowState | null> {
  const user = await requireActiveUser();
  const parsedId = ResumeIdSchema.safeParse(resumeId);

  if (!parsedId.success) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .select("id, file_name, status, improve_with_ai, extracted_data")
    .eq("id", parsedId.data)
    .eq("user_id", user.userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const status = ResumeStatusSchema.safeParse(data.status);

  if (!status.success) {
    return null;
  }

  return {
    id: data.id,
    fileName: data.file_name,
    status: status.data,
    improveWithAi: data.improve_with_ai,
    extractionSource: null,
    profilePhotoCandidates:
      status.data === "completed"
        ? await listResumeProfileCandidates(user.userId, data.id, supabase)
        : [],
    portfolio: parseStoredPortfolio(data.extracted_data),
  };
}
