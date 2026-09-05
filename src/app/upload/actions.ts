"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  extractPortfolioFromPdf,
  logResumeExtractionError,
  ResumeExtractionError,
} from "@/lib/ai/resume-extraction";
import { requireActiveUser } from "@/lib/auth/guards";
import { createPortfolioDraft } from "@/lib/portfolios/mutations";
import { createPortfolioSlugBase } from "@/lib/portfolios/slug";
import {
  listResumeProfileCandidates,
  storeResumeProfileCandidates,
} from "@/lib/profile-media/resume-storage";
import type { ProfilePhotoCandidate } from "@/lib/profile-media/types";
import { parseStoredPortfolio, toDatabaseJson } from "@/lib/resumes/json";
import { extractResumeProfileMedia } from "@/lib/resumes/media";
import { ResumeProcessingTiming } from "@/lib/resumes/timing";
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

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

function logProfileMediaEvent(
  stage: "complete" | "failed",
  details: Record<string, boolean | number> = {},
) {
  if (process.env.NODE_ENV === "development") {
    const method = stage === "failed" ? console.warn : console.info;
    method("[resume-profile-media]", { stage, ...details });
  }
}

async function listProfileCandidatesBestEffort(
  userId: string,
  resumeId: string,
  supabase: ServerSupabaseClient,
) {
  try {
    return await listResumeProfileCandidates(userId, resumeId, supabase);
  } catch {
    logProfileMediaEvent("failed");
    return [];
  }
}

async function addBestEffortProfileMedia({
  pdfBytes,
  resumeId,
  supabase,
  timing,
  userId,
}: {
  pdfBytes: Uint8Array;
  resumeId: string;
  supabase: ServerSupabaseClient;
  timing: ResumeProcessingTiming;
  userId: string;
}): Promise<{
  automaticProfileImageUrl: string;
  candidates: ProfilePhotoCandidate[];
}> {
  try {
    const media = await timing.measure("profile-media-extraction", () =>
      extractResumeProfileMedia(pdfBytes),
    );
    const stored = await timing.measure("profile-media-storage", () =>
      storeResumeProfileCandidates(userId, resumeId, media, supabase),
    );

    logProfileMediaEvent("complete", {
      automaticSelection: Boolean(stored.automaticProfileImageUrl),
      discoveredImages: media.diagnostics.discoveredImages,
      duplicateImages: media.diagnostics.duplicateImages,
      pageFailures: media.diagnostics.pageFailures,
      rejectedImages: media.diagnostics.rejectedImages,
      storedCandidates: stored.candidates.length,
    });
    return stored;
  } catch {
    // Profile media is optional. A worker/decoder/storage failure must never
    // turn otherwise valid resume text extraction into a failed resume.
    logProfileMediaEvent("failed");
    return { automaticProfileImageUrl: "", candidates: [] };
  }
}

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
  const timing = new ResumeProcessingTiming("resume-upload");
  let outcome: "failed" | "rejected" | "success" = "failed";

  try {
    const user = await requireActiveUser();
    const validation = await timing.measure("pdf-validation", () =>
      validateResumeUpload(formData.get("resume")),
    );

    if (!validation.success) {
      outcome = "rejected";
      return validation;
    }

    const improveWithAi = formData.get("improveWithAi") === "on";
    const supabase = await createClient();
    const storagePath = `${user.userId}/${crypto.randomUUID()}.pdf`;
    const { bytes, fileName } = validation.data;
    const { error: uploadError } = await timing.measure(
      "storage-upload",
      () =>
        supabase.storage.from(RESUME_BUCKET).upload(storagePath, bytes, {
          cacheControl: "3600",
          contentType: "application/pdf",
          upsert: false,
        }),
    );

    if (uploadError) {
      return {
        success: false,
        message: "The resume could not be uploaded. Please try again.",
      };
    }

    const { data, error: insertError } = await timing.measure(
      "database-write",
      () =>
        supabase
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
          .single(),
    );

    if (insertError || !data) {
      await supabase.storage.from(RESUME_BUCKET).remove([storagePath]);

      return {
        success: false,
        message: "The upload could not be recorded. Please try again.",
      };
    }

    timing.measureSync("redirect-preparation", () => revalidatePath("/upload"));
    outcome = "success";

    return {
      success: true,
      resume: {
        id: data.id,
        fileName: data.file_name,
        status: "uploaded",
        improveWithAi: data.improve_with_ai,
      },
    };
  } finally {
    timing.finish(outcome);
  }
}

export async function processResume(
  resumeId: string,
): Promise<ProcessResumeResult> {
  const processingStartedAt = performance.now();
  const timing = new ResumeProcessingTiming("resume-processing");
  let outcome: "failed" | "rejected" | "success" = "failed";

  try {
    const user = await requireActiveUser();
    const parsedId = ResumeIdSchema.safeParse(resumeId);

    if (!parsedId.success) {
      outcome = "rejected";
      return invalidResumeResult();
    }

    const supabase = await createClient();
    const { data: existing, error: readError } = await timing.measure(
      "database-read",
      () =>
        supabase
          .from("resumes")
          .select(
            "id, file_path, status, improve_with_ai, extracted_data, updated_at",
          )
          .eq("id", parsedId.data)
          .eq("user_id", user.userId)
          .maybeSingle(),
    );

    if (readError || !existing) {
      if (readError) {
        logResumeExtractionError("database-read", readError);
      }

      outcome = "rejected";
      return invalidResumeResult();
    }

    const parsedStatus = ResumeStatusSchema.safeParse(existing.status);

    if (!parsedStatus.success) {
      outcome = "rejected";
      return invalidResumeResult();
    }

    const status: ResumeStatus = parsedStatus.data;

    if (status === "completed") {
      const portfolio = timing.measureSync("portfolio-validation", () =>
        parseStoredPortfolio(existing.extracted_data),
      );
      outcome = portfolio ? "success" : "failed";

      const profilePhotoCandidates = portfolio
        ? await listProfileCandidatesBestEffort(
            user.userId,
            existing.id,
            supabase,
          )
        : [];

      return portfolio
        ? { success: true, portfolio, profilePhotoCandidates }
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
      outcome = "rejected";
      return {
        success: false,
        message: PROCESSING_MESSAGE,
        retryable: false,
        status,
      };
    }

    const { data: claim, error: claimError } = await timing.measure(
      "database-claim",
      () =>
        supabase
          .from("resumes")
          .update({ extracted_data: null, status: "processing" })
          .eq("id", existing.id)
          .eq("user_id", user.userId)
          .eq("status", existing.status)
          .eq("updated_at", existing.updated_at)
          .select("id, file_path, improve_with_ai, updated_at")
          .maybeSingle(),
    );

    if (claimError || !claim) {
      logResumeExtractionError(
        "database-claim",
        claimError ??
          new ResumeExtractionError(
            "database-claim",
            "The processing claim was not acquired.",
          ),
      );

      outcome = "rejected";
      return {
        success: false,
        message: PROCESSING_MESSAGE,
        retryable: false,
        status: "processing",
      };
    }

    try {
      const pdfBytes = await timing.measure("storage-download", async () => {
        const { data: resumeFile, error: downloadError } =
          await supabase.storage
            .from(RESUME_BUCKET)
            .download(claim.file_path);

        if (downloadError || !resumeFile) {
          throw new ResumeExtractionError(
            "storage-download",
            "Resume download failed.",
            { cause: downloadError },
          );
        }

        return new Uint8Array(await resumeFile.arrayBuffer());
      });
      const validPdf = timing.measureSync("stored-pdf-validation", () =>
        validateStoredPdf(pdfBytes),
      );

      if (!validPdf) {
        throw new ResumeExtractionError(
          "stored-pdf-validation",
          "Stored resume validation failed.",
        );
      }

      let portfolio = await extractPortfolioFromPdf(
        pdfBytes,
        claim.improve_with_ai,
        { demoStartedAtMs: processingStartedAt, timing },
      );
      const profileMedia = await addBestEffortProfileMedia({
        pdfBytes,
        resumeId: claim.id,
        supabase,
        timing,
        userId: user.userId,
      });

      if (profileMedia.automaticProfileImageUrl) {
        portfolio = {
          ...portfolio,
          personal: {
            ...portfolio.personal,
            profileImageUrl: profileMedia.automaticProfileImageUrl,
          },
        };
      }

      const { data: completed, error: completeError } = await timing.measure(
        "database-write",
        () =>
          supabase
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
            .maybeSingle(),
      );

      if (completeError || !completed) {
        logResumeExtractionError(
          "database-completion",
          completeError ??
            new ResumeExtractionError(
              "database-completion",
              "The completed extraction was not persisted.",
            ),
        );

        return {
          success: false,
          message: PROCESSING_MESSAGE,
          retryable: false,
          status: "processing",
        };
      }

      timing.measureSync("redirect-preparation", () =>
        revalidatePath("/upload"),
      );
      outcome = "success";
      return {
        success: true,
        portfolio,
        profilePhotoCandidates: profileMedia.candidates,
      };
    } catch (error) {
      logResumeExtractionError("process-resume", error);

      const { error: failureUpdateError } = await timing.measure(
        "database-failure-write",
        () =>
          supabase
            .from("resumes")
            .update({ extracted_data: null, status: "failed" })
            .eq("id", claim.id)
            .eq("user_id", user.userId)
            .eq("status", "processing")
            .eq("updated_at", claim.updated_at),
      );

      if (failureUpdateError) {
        logResumeExtractionError(
          "database-failure-update",
          failureUpdateError,
        );
      }

      timing.measureSync("redirect-preparation", () =>
        revalidatePath("/upload"),
      );
      return {
        success: false,
        message: PROCESSING_ERROR_MESSAGE,
        retryable: true,
        status: "failed",
      };
    }
  } finally {
    timing.finish(outcome);
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

  const title =
    portfolio.data.personal.fullName.trim() ||
    user.profile.full_name?.trim() ||
    "Portfolio";
  const slugBase = createPortfolioSlugBase(
    user.profile.username,
    portfolio.data.personal.fullName || user.profile.full_name,
  );
  const savedPortfolio = await createPortfolioDraft({
    content: portfolio.data,
    resumeId: parsedId.data,
    source: "resume",
    slugBase,
    title,
    userId: user.userId,
  });

  if (!savedPortfolio) {
    return {
      success: false,
      message: "The reviewed portfolio could not be saved. Please try again.",
    };
  }

  revalidatePath("/upload");
  revalidatePath("/dashboard");
  revalidatePath("/themes");
  return { success: true, portfolioId: savedPortfolio.portfolioId };
}
