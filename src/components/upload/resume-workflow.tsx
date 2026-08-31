"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileText,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type DragEvent,
  type FormEvent,
} from "react";

import {
  processResume,
  saveResumeReview,
  uploadResume,
} from "@/app/upload/actions";
import { ManualPortfolioButton } from "@/components/portfolio/manual-portfolio-button";
import { ResumeReviewEditor } from "@/components/resume/resume-review-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MAX_RESUME_BYTES } from "@/lib/resumes/validation";
import type { ResumeWorkflowState } from "@/lib/resumes/types";
import { cn } from "@/lib/utils";
import type { PortfolioData } from "@/types/portfolio";

import styles from "./resume-workflow.module.css";

type Feedback = {
  tone: "error" | "info" | "success";
  message: string;
};

function validateBrowserFile(file: File) {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return "Choose a PDF resume.";
  }

  if (file.size === 0 || file.size > MAX_RESUME_BYTES) {
    return "The PDF must be larger than 0 bytes and no more than 10 MB.";
  }

  if (file.type && file.type.toLowerCase() !== "application/pdf") {
    return "Only PDF resumes are supported.";
  }

  return null;
}

export function ResumeWorkflow({
  initialState,
  hasRequestedResume,
}: {
  initialState: ResumeWorkflowState | null;
  hasRequestedResume: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoProcessId = useRef<string | null>(null);
  const [resume, setResume] = useState(initialState);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(
    initialState?.portfolio ?? null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [improveWithAi, setImproveWithAi] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(
    hasRequestedResume && !initialState
      ? { tone: "error", message: "That resume is unavailable." }
      : null,
  );
  const [isWorking, startWorking] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [isPolling, startPolling] = useTransition();

  const beginProcessing = useCallback(
    (resumeId: string) => {
      setResume((current) =>
        current?.id === resumeId
          ? { ...current, status: "processing" }
          : current,
      );
      setFeedback(null);

      startWorking(async () => {
        try {
          const result = await processResume(resumeId);

          if (result.success) {
            setPortfolio(result.portfolio);
            setResume((current) =>
              current?.id === resumeId
                ? {
                    ...current,
                    portfolio: result.portfolio,
                    profilePhotoCandidates: result.profilePhotoCandidates,
                    status: "completed",
                  }
                : current,
            );
            setFeedback({
              tone: "success",
              message: "Extraction complete. Review every section before saving.",
            });
            return;
          }

          if (result.status) {
            setResume((current) =>
              current?.id === resumeId
                ? { ...current, status: result.status! }
                : current,
            );
          }

          setFeedback({
            tone: result.status === "processing" ? "info" : "error",
            message: result.message,
          });
        } catch {
          setFeedback({
            tone: "error",
            message: "The processing request was interrupted. Refresh to check it.",
          });
          router.refresh();
        }
      });
    },
    [router],
  );

  useEffect(() => {
    if (
      resume?.status !== "uploaded" ||
      autoProcessId.current === resume.id
    ) {
      return;
    }

    autoProcessId.current = resume.id;
    beginProcessing(resume.id);
  }, [beginProcessing, resume]);

  useEffect(() => {
    if (resume?.status !== "processing" || isWorking) {
      return;
    }

    const interval = window.setInterval(() => {
      if (!isPolling) {
        startPolling(() => router.refresh());
      }
    }, 3_000);
    return () => window.clearInterval(interval);
  }, [isPolling, isWorking, resume?.status, router]);

  function chooseFile(file: File | null) {
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const message = validateBrowserFile(file);

    if (message) {
      setSelectedFile(null);
      setFeedback({ tone: "error", message });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedFile(file);
    setFeedback(null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    chooseFile(event.dataTransfer.files.item(0));
  }

  function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setFeedback({ tone: "error", message: "Choose a PDF resume to continue." });
      return;
    }

    const formData = new FormData();
    formData.set("resume", selectedFile);
    if (improveWithAi) {
      formData.set("improveWithAi", "on");
    }

    setFeedback(null);
    startWorking(async () => {
      try {
        const result = await uploadResume(formData);

        if (!result.success) {
          setFeedback({ tone: "error", message: result.message });
          return;
        }

        setResume({
          ...result.resume,
          portfolio: null,
          profilePhotoCandidates: [],
        });
        setPortfolio(null);
        window.history.replaceState(
          null,
          "",
          `/upload?resume=${encodeURIComponent(result.resume.id)}`,
        );
      } catch {
        setFeedback({
          tone: "error",
          message: "The upload request was interrupted. Please try again.",
        });
      }
    });
  }

  function saveReview() {
    if (!resume || !portfolio) {
      return;
    }

    setFeedback(null);
    startSaving(async () => {
      try {
        const result = await saveResumeReview(resume.id, portfolio);

        if (!result.success) {
          setFeedback({ tone: "error", message: result.message });
          return;
        }

        router.push(
          `/themes?portfolio=${encodeURIComponent(result.portfolioId)}`,
        );
        router.refresh();
      } catch {
        setFeedback({
          tone: "error",
          message: "The save request was interrupted. Please try again.",
        });
      }
    });
  }

  function startAnotherUpload() {
    autoProcessId.current = null;
    setResume(null);
    setPortfolio(null);
    setSelectedFile(null);
    setImproveWithAi(false);
    setFeedback(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    window.history.replaceState(null, "", "/upload");
  }

  return (
    <div className={styles.workflow}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>
          {resume?.status === "completed" ? "Review" : "Let’s begin"}
        </p>
        <h1 className={styles.title}>
          {resume?.status === "completed"
            ? "Review your portfolio details."
            : resume
              ? "Preparing your portfolio."
              : "Turn your resume into something worth sharing."}
        </h1>
        <p className={styles.description}>
          {resume?.status === "completed"
            ? "Make any changes before choosing your design."
            : "Upload your resume and we’ll prepare it for your portfolio."}
        </p>
      </header>
      <WorkflowSteps status={resume?.status ?? null} />
      {feedback ? <FeedbackMessage feedback={feedback} /> : null}

      {!resume ? (
        <Card className={styles.uploadCard}>
          <CardHeader>
            <CardTitle>
              <h2 className={styles.uploadHeading}>
                Upload your resume
              </h2>
            </CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7">
              Choose one PDF up to 10 MB. We&apos;ll organize it into editable portfolio details for you to review.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleUpload}>
            <CardContent className="space-y-5">
              <div
                className={cn(
                  styles.dropzone,
                  isDragging && styles.dropzoneActive,
                )}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
              >
                <span className={styles.uploadIcon}>
                  <UploadCloud aria-hidden="true" className="size-7" />
                </span>
                <p className={styles.fileName}>
                  {selectedFile ? selectedFile.name : "Drop your resume here"}
                </p>
                <p className={styles.fileHelp}>
                  {selectedFile
                    ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                    : "PDF · up to 10 MB"}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    variant="outline"
                  >
                    {selectedFile ? "Replace PDF" : "Choose PDF"}
                  </Button>
                  {selectedFile ? (
                    <Button
                      onClick={() => chooseFile(null)}
                      type="button"
                      variant="ghost"
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                <input
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={(event) =>
                    chooseFile(event.target.files?.item(0) ?? null)
                  }
                  ref={fileInputRef}
                  type="file"
                />
              </div>

              <label className={styles.aiOption}>
                <input
                  checked={improveWithAi}
                  className="mt-0.5 size-4 rounded border-input"
                  name="improveWithAi"
                  onChange={(event) => setImproveWithAi(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles aria-hidden="true" className="size-4" />
                    Improve wording with AI
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                    Improve clarity and tone without adding unsupported facts,
                    credentials, technologies, dates, or metrics.
                  </span>
                </span>
              </label>
            </CardContent>
            <CardFooter className="justify-end">
              <Button disabled={!selectedFile || isWorking} size="lg" type="submit">
                {isWorking ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="animate-spin"
                  />
                ) : (
                  <UploadCloud aria-hidden="true" />
                )}
                Upload and extract
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : null}

      {!resume ? (
        <Card className={styles.manualCard}>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg font-semibold">Don&apos;t have a resume?</h2>
            </CardTitle>
            <CardDescription className="leading-6">
              Start with a blank portfolio and add your information directly.
              This path starts with a clean editor, ready for your details.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <ManualPortfolioButton size="lg" />
          </CardFooter>
        </Card>
      ) : null}

      {resume?.status === "uploaded" || resume?.status === "processing" ? (
        <ProcessingCard fileName={resume.fileName} />
      ) : null}

      {resume?.status === "failed" ? (
        <Card className={styles.errorCard}>
          <CardHeader>
            <div className={styles.errorIcon}>
              <AlertCircle aria-hidden="true" className="size-5" />
            </div>
            <CardTitle>
              <h1 className="text-xl font-semibold">Extraction needs another try</h1>
            </CardTitle>
            <CardDescription>
              The private upload is still available. Retry the extraction or
              upload a different PDF.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex-wrap justify-end gap-2">
            <Button onClick={startAnotherUpload} type="button" variant="outline">
              Upload another
            </Button>
            <Button
              disabled={isWorking}
              onClick={() => beginProcessing(resume.id)}
              type="button"
            >
              <RefreshCw
                aria-hidden="true"
                className={cn(isWorking && "animate-spin")}
              />
              Retry extraction
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {resume?.status === "completed" && portfolio ? (
        <div className="space-y-6">
          <div className={styles.reviewHeader}>
            <div>
              <Badge variant="secondary">Ready to review</Badge>
              <h2 className={styles.reviewTitle}>Make it feel like you.</h2>
              <p className={styles.reviewDescription}>
                Check every detail, make any edits you need, then continue to your design.
              </p>
            </div>
            <Button onClick={startAnotherUpload} type="button" variant="outline">
              Upload another
            </Button>
          </div>

          <ResumeReviewEditor
            improveWithAi={resume.improveWithAi}
            onChange={setPortfolio}
            photoScope={{ id: resume.id, kind: "resume" }}
            profilePhotoCandidates={resume.profilePhotoCandidates}
            value={portfolio}
          />

          <div className={styles.saveBar}>
            <p className="text-sm text-muted-foreground">
              Saving keeps the reviewed data on this resume record.
            </p>
            <Button disabled={isSaving} onClick={saveReview} size="lg" type="button">
              {isSaving ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <CheckCircle2 aria-hidden="true" />
              )}
              Save and choose a theme
            </Button>
          </div>
        </div>
      ) : null}

      {resume?.status === "completed" && !portfolio ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-xl font-semibold">Review data is unavailable</h1>
            </CardTitle>
            <CardDescription>
              Upload the resume again to create a fresh reviewed copy.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-end">
            <Button onClick={startAnotherUpload} type="button">
              Upload another
            </Button>
          </CardFooter>
        </Card>
      ) : null}
    </div>
  );
}

function WorkflowSteps({
  status,
}: {
  status: ResumeWorkflowState["status"] | null;
}) {
  const current =
    status === "completed"
      ? 3
      : status === "processing" || status === "uploaded" || status === "failed"
        ? 2
        : 1;
  const steps = ["Upload", "Extract", "Review"];

  return (
    <ol aria-label="Resume workflow" className={styles.steps}>
      {steps.map((step, index) => {
        const number = index + 1;
        const active = number <= current;

        return (
          <li
            className={cn(
              styles.step,
              active && styles.stepActive,
            )}
            key={step}
          >
            <span
              className={cn(
                styles.stepNumber,
                active && styles.stepNumberActive,
              )}
            >
              {number}
            </span>
            {step}
          </li>
        );
      })}
    </ol>
  );
}

function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  return (
    <div
      aria-live="polite"
      className={cn(
        styles.feedback,
        feedback.tone === "error" && styles.feedbackError,
        feedback.tone === "success" && styles.feedbackSuccess,
      )}
      role={feedback.tone === "error" ? "alert" : "status"}
    >
      {feedback.tone === "error" ? (
        <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      )}
      {feedback.message}
    </div>
  );
}

function ProcessingCard({ fileName }: { fileName: string }) {
  const stages = [
    "Reading resume",
    "Identifying experience",
    "Organizing projects",
    "Extracting skills",
    "Preparing portfolio",
  ];
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(
      () => setActiveStage((current) => (current + 1) % stages.length),
      1_800,
    );

    return () => window.clearInterval(interval);
  }, [stages.length]);

  return (
    <Card aria-live="polite" className={styles.processingCard}>
      <CardHeader className="items-center text-center">
        <div className={styles.processingIcon}>
          <FileText aria-hidden="true" className="size-6" />
          <LoaderCircle
            aria-hidden="true"
            className={`${styles.spinner} size-5 animate-spin`}
          />
        </div>
        <CardTitle>
          <h2 className="text-xl font-semibold">Analyzing your resume...</h2>
        </CardTitle>
        <CardDescription className="max-w-md leading-6">
          We&apos;re organizing {fileName} into a portfolio draft. Keep this page open while we finish.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className={styles.stages} aria-label="Processing stages">
          <li className={styles.stageDone}>
            <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
            Resume uploaded
          </li>
          {stages.map((stage, index) => (
            <li
              className={cn(
                styles.stage,
                activeStage === index && styles.stageActive,
              )}
              key={stage}
            >
              {activeStage === index ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 shrink-0 animate-spin"
                />
              ) : (
                <span className="ml-1 size-2 shrink-0 rounded-full border" />
              )}
              {stage}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
