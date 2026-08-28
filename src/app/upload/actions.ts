"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { extractPortfolioFromPdf } from "@/lib/ai/resume-extraction";
import { requireActiveUser } from "@/lib/auth/guards";
import { parseStoredPortfolio, toDatabaseJson } from "@/lib/resumes/json";
import {
  RESUME_STATUSES,
  type ProcessResumeResult,
  type ResumeStatus,
  type SaveResumeResult,
  type UploadResumeResult,
} from "@/lib/resumes/types";
import {
  isProcessingClaimStale,
  MAX_PORTFOLIO_JSON_BYTES,
  RESUME_BUCKET,
  ResumeIdSchema,
  validateResumeUpload,
  validateStoredPdf,
} from "@/lib/resumes/validation";
import { createClient } from "@/lib/supabase/server";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";
import type { PortfolioData } from "@/types/portfolio";

const ResumeStatusSchema = z.enum(RESUME_STATUSES);

const PROCESSING_MESSAGE =
  "This resume is already being processed. Refresh shortly to see the result.";
const PROCESSING_ERROR_MESSAGE =
  "We could not process this resume. Please try again.";

function invalidResumeResult(): ProcessResumeResult {
  return {
    success: false,
    message: "That resume is unavailable.",
    retryable: false,
  };
}

export async function uploadResume(
  formData: FormData,
): Promise<UploadResumeResult> {
  const user = await requireActiveUser();
  const validation = await validateResumeUpload(formData.get("resume"));

  if (!validation.success) {
    return validation;
  }

  const improveWithAi = formData.get("improveWithAi") === "on";
  const supabase = await createClient();
  const storagePath = `${user.userId}/${crypto.randomUUID()}.pdf`;
  const { bytes, fileName } = validation.data;
  const { error: uploadError } = await supabase.storage
    .from(RESUME_BUCKET)
    .upload(storagePath, bytes, {
      cacheControl: "3600",
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    return {
      success: false,
      message: "The resume could not be uploaded. Please try again.",
    };
  }

  const { data, error: insertError } = await supabase
    .from("resumes")
    .insert({
      extracted_data: null,
      file_name: fileName,
      file_path: storagePath,
      improve_with_ai: improveWithAi,
      status: "uploaded",
      user_id: user.userId,
    })
    .select("id, file_name, status, improve_with_ai")
    .single();

  if (insertError || !data) {
    await supabase.storage.from(RESUME_BUCKET).remove([storagePath]);

    return {
      success: false,
      message: "The upload could not be recorded. Please try again.",
    };
  }

  revalidatePath("/upload");

  return {
    success: true,
    resume: {
      id: data.id,
      fileName: data.file_name,
      status: "uploaded",
      improveWithAi: data.improve_with_ai,
    },
  };
}

export async function processResume(
  resumeId: string,
): Promise<ProcessResumeResult> {
  const user = await requireActiveUser();
  const parsedId = ResumeIdSchema.safeParse(resumeId);

  if (!parsedId.success) {
    return invalidResumeResult();
  }

  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase
    .from("resumes")
    .select(
      "id, file_path, status, improve_with_ai, extracted_data, updated_at",
    )
    .eq("id", parsedId.data)
    .eq("user_id", user.userId)
    .maybeSingle();

  if (readError || !existing) {
    return invalidResumeResult();
  }

  const parsedStatus = ResumeStatusSchema.safeParse(existing.status);

  if (!parsedStatus.success) {
    return invalidResumeResult();
  }

  const status: ResumeStatus = parsedStatus.data;

  if (status === "completed") {
    const portfolio = parseStoredPortfolio(existing.extracted_data);

    return portfolio
      ? { success: true, portfolio }
      : {
          success: false,
          message: PROCESSING_ERROR_MESSAGE,
          retryable: false,
          status,
        };
  }

  if (
    status === "processing" &&
    !isProcessingClaimStale(existing.updated_at)
  ) {
    return {
      success: false,
      message: PROCESSING_MESSAGE,
      retryable: false,
      status,
    };
  }

  const { data: claim, error: claimError } = await supabase
    .from("resumes")
    .update({ extracted_data: null, status: "processing" })
    .eq("id", existing.id)
    .eq("user_id", user.userId)
    .eq("status", existing.status)
    .eq("updated_at", existing.updated_at)
    .select("id, file_path, improve_with_ai, updated_at")
    .maybeSingle();

  if (claimError || !claim) {
    return {
      success: false,
      message: PROCESSING_MESSAGE,
      retryable: false,
      status: "processing",
    };
  }

  try {
    const { data: resumeFile, error: downloadError } = await supabase.storage
      .from(RESUME_BUCKET)
      .download(claim.file_path);

    if (downloadError || !resumeFile) {
      throw new Error("Resume download failed.");
    }

    const pdfBytes = new Uint8Array(await resumeFile.arrayBuffer());

    if (!validateStoredPdf(pdfBytes)) {
      throw new Error("Stored resume validation failed.");
    }

    const portfolio = await extractPortfolioFromPdf(
      pdfBytes,
      claim.improve_with_ai,
    );
    const { data: completed, error: completeError } = await supabase
      .from("resumes")
      .update({
        extracted_data: toDatabaseJson(portfolio),
        status: "completed",
      })
      .eq("id", claim.id)
      .eq("user_id", user.userId)
      .eq("status", "processing")
      .eq("updated_at", claim.updated_at)
      .select("id")
      .maybeSingle();

    if (completeError || !completed) {
      return {
        success: false,
        message: PROCESSING_MESSAGE,
        retryable: false,
        status: "processing",
      };
    }

    revalidatePath("/upload");
    return { success: true, portfolio };
  } catch {
    await supabase
      .from("resumes")
      .update({ extracted_data: null, status: "failed" })
      .eq("id", claim.id)
      .eq("user_id", user.userId)
      .eq("status", "processing")
      .eq("updated_at", claim.updated_at);

    revalidatePath("/upload");
    return {
      success: false,
      message: PROCESSING_ERROR_MESSAGE,
      retryable: true,
      status: "failed",
    };
  }
}

export async function saveResumeReview(
  resumeId: string,
  portfolioValue: PortfolioData,
): Promise<SaveResumeResult> {
  const user = await requireActiveUser();
  const parsedId = ResumeIdSchema.safeParse(resumeId);
  const portfolio = PortfolioDataSchema.safeParse(portfolioValue);

  if (!parsedId.success || !portfolio.success) {
    return {
      success: false,
      message: "Review the portfolio fields and try saving again.",
    };
  }

  const serialized = JSON.stringify(portfolio.data);

  if (new TextEncoder().encode(serialized).length > MAX_PORTFOLIO_JSON_BYTES) {
    return {
      success: false,
      message: "This portfolio is too large to save.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .update({ extracted_data: toDatabaseJson(portfolio.data) })
    .eq("id", parsedId.data)
    .eq("user_id", user.userId)
    .eq("status", "completed")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      success: false,
      message: "The reviewed portfolio could not be saved. Please try again.",
    };
  }

  revalidatePath("/upload");
  return { success: true };
}
