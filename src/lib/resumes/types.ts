import type { ProfilePhotoCandidate } from "@/lib/profile-media/types";
import type { PortfolioData } from "@/types/portfolio";

export const RESUME_STATUSES = [
  "uploaded",
  "processing",
  "completed",
  "failed",
] as const;

export type ResumeStatus = (typeof RESUME_STATUSES)[number];

export type ResumeWorkflowState = {
  id: string;
  fileName: string;
  status: ResumeStatus;
  improveWithAi: boolean;
  profilePhotoCandidates: ProfilePhotoCandidate[];
  portfolio: PortfolioData | null;
};

export type UploadResumeResult =
  | {
      success: true;
      resume: Pick<
        ResumeWorkflowState,
        "id" | "fileName" | "status" | "improveWithAi"
      >;
    }
  | { success: false; message: string };

export type ProcessResumeResult =
  | {
      success: true;
      portfolio: PortfolioData;
      profilePhotoCandidates: ProfilePhotoCandidate[];
    }
  | {
      success: false;
      message: string;
      retryable: boolean;
      status?: ResumeStatus;
    };

export type SaveResumeResult =
  | { success: true; portfolioId: string }
  | { success: false; message: string };
