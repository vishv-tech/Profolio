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
    <div className="space-y-6">
      <WorkflowSteps status={resume?.status ?? null} />
      {feedback ? <FeedbackMessage feedback={feedback} /> : null}

      {!resume ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-2xl font-semibold tracking-tight">
                Upload your resume
              </h1>
            </CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7">
              Upload one PDF up to 10 MB. It stays in your private Supabase
              Storage folder while Gemini converts it into editable portfolio
              data.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleUpload}>
            <CardContent className="space-y-5">
              <div
                className={cn(
                  "rounded-xl border-2 border-dashed p-6 text-center transition-colors sm:p-10",
                  isDragging
                    ? "border-foreground bg-muted"
                    : "border-border bg-muted/20",
                )}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
              >
                <UploadCloud
                  aria-hidden="true"
                  className="mx-auto size-9 text-muted-foreground"
                />
                <p className="mt-3 font-medium">
                  {selectedFile ? selectedFile.name : "Drop your PDF here"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedFile
                    ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                    : "or choose a file from your device"}
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

              <label className="flex items-start gap-3 rounded-xl border p-4">
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
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg font-semibold">Don&apos;t have a resume?</h2>
            </CardTitle>
            <CardDescription className="leading-6">
              Start with a blank portfolio and add your information directly.
              This path skips PDF upload and AI extraction completely.
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
        <Card>
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
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
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Badge variant="secondary">Review</Badge>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight">
                Review your portfolio data
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                AI can make mistakes. Verify every fact, then save this reviewed
                version before selecting a theme.
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

          <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
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
    <ol aria-label="Resume workflow" className="grid grid-cols-3 gap-2">
      {steps.map((step, index) => {
        const number = index + 1;
        const active = number <= current;

        return (
          <li
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium sm:text-sm",
              active ? "bg-foreground text-background" : "text-muted-foreground",
            )}
            key={step}
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]",
                active ? "bg-background/15" : "bg-muted",
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
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        feedback.tone === "error" &&
          "border-destructive/30 bg-destructive/5 text-destructive",
        feedback.tone === "info" && "bg-muted/50",
        feedback.tone === "success" && "bg-muted/50",
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
    <Card aria-live="polite">
      <CardHeader className="items-center text-center">
        <div className="relative flex size-14 items-center justify-center rounded-full bg-muted">
          <FileText aria-hidden="true" className="size-6" />
          <LoaderCircle
            aria-hidden="true"
            className="absolute -right-1 -top-1 size-5 animate-spin"
          />
        </div>
        <CardTitle>
          <h1 className="text-xl font-semibold">Extracting resume details</h1>
        </CardTitle>
        <CardDescription className="max-w-md leading-6">
          Processing {fileName}. This can take a minute; keep this page open or
          return later using the same URL.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="mx-auto max-w-md space-y-2" aria-label="Processing stages">
          <li className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm">
            <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
            Resume uploaded
          </li>
          {stages.map((stage, index) => (
            <li
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground",
                activeStage === index && "bg-muted font-medium text-foreground",
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
        <p className="mx-auto mt-4 max-w-md text-xs leading-5 text-muted-foreground">
          These labels rotate during one extraction request; they are not
          separate backend checkpoints.
        </p>
      </CardContent>
    </Card>
  );
}
