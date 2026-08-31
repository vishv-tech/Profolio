"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { ContentImprovementPanel } from "@/components/portfolio-intelligence/content-improvement-panel";
import { ResumeReviewEditor } from "@/components/resume/resume-review-editor";
import { Button } from "@/components/ui/button";
import { savePortfolioDraft } from "@/lib/portfolios/draft-actions";
import type { PortfolioData } from "@/types/portfolio";

import styles from "./portfolio-draft-editor.module.css";

export function PortfolioDraftEditor({
  initialContent,
  initialUpdatedAt,
  portfolioId,
}: {
  initialContent: PortfolioData;
  initialUpdatedAt: string;
  portfolioId: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    if (!dirty) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);

  function save() {
    setMessage(null);
    startSaving(async () => {
      try {
        const result = await savePortfolioDraft(portfolioId, updatedAt, content);
        if (!result.success) {
          setMessage(result.message);
          return;
        }
        setContent(result.content);
        setUpdatedAt(result.updatedAt);
        setDirty(false);
        setMessage("Draft saved. Republish when you want these edits on the public portfolio.");
      } catch {
        setMessage("The draft could not be saved. Please try again.");
      }
    });
  }

  return (
    <div className={styles.editor}>
      <div className={styles.saveBar}>
        <div>
          <p className={styles.saveTitle}>Portfolio draft</p>
          <p className={styles.saveStatus}>
            {dirty ? "Unsaved changes" : "All changes saved"}
          </p>
        </div>
        <Button className={styles.saveButton} disabled={isSaving || !dirty} onClick={save} type="button">
          {isSaving ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <Save aria-hidden="true" />
          )}
          {isSaving ? "Saving..." : "Save draft"}
        </Button>
      </div>

      <div aria-live="polite">
        {message ? <p className={styles.message}>{message}</p> : null}
      </div>

      <ContentImprovementPanel
        data={content}
        onAccepted={(nextContent, nextUpdatedAt) => {
          setContent(nextContent);
          setUpdatedAt(nextUpdatedAt);
          setDirty(false);
        }}
        portfolioId={portfolioId}
      />

      <ResumeReviewEditor
        improveWithAi={false}
        onChange={(nextContent) => {
          setContent(nextContent);
          setDirty(true);
          setMessage(null);
        }}
        photoScope={{ id: portfolioId, kind: "portfolio" }}
        value={content}
      />
    </div>
  );
}
