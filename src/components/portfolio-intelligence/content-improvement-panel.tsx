"use client";

import { Check, LoaderCircle, Sparkles, X } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  applyContentImprovementAction,
  generateContentImprovementAction,
} from "@/lib/portfolio-intelligence/actions";
import type {
  ContentImprovementPatch,
  ContentImprovementTarget,
} from "@/lib/portfolio-intelligence/schemas";
import type { PortfolioData } from "@/types/portfolio";

type TargetOption = {
  key: string;
  label: string;
  target: ContentImprovementTarget;
};

function target(
  key: string,
  label: string,
  value: Omit<ContentImprovementTarget, "original">,
  original: string,
): TargetOption | null {
  return original.trim()
    ? { key, label, target: { ...value, original } }
    : null;
}

function improvementTargets(data: PortfolioData): TargetOption[] {
  const options: Array<TargetOption | null> = [
    target(
      "summary",
      "Professional summary",
      { section: "summary", itemId: null, field: "summary", listIndex: null },
      data.summary,
    ),
    target(
      "headline",
      "Professional headline",
      { section: "personal", itemId: null, field: "headline", listIndex: null },
      data.personal.headline,
    ),
  ];

  for (const item of data.experience) {
    options.push(
      target(
        `experience-${item.id}-description`,
        `Experience · ${item.role || item.company || "Untitled"} · description`,
        { section: "experience", itemId: item.id, field: "description", listIndex: null },
        item.description,
      ),
      ...item.highlights.map((highlight, index) =>
        target(
          `experience-${item.id}-highlight-${index}`,
          `Experience · ${item.role || item.company || "Untitled"} · highlight ${index + 1}`,
          { section: "experience", itemId: item.id, field: "highlight", listIndex: index },
          highlight,
        ),
      ),
    );
  }

  for (const item of data.education) {
    options.push(
      target(
        `education-${item.id}-description`,
        `Education · ${item.degree || item.institution || "Untitled"} · description`,
        { section: "education", itemId: item.id, field: "description", listIndex: null },
        item.description,
      ),
    );
  }

  for (const item of data.projects) {
    options.push(
      target(
        `project-${item.id}-description`,
        `Project · ${item.name || "Untitled"} · description`,
        { section: "projects", itemId: item.id, field: "description", listIndex: null },
        item.description,
      ),
      ...item.highlights.map((highlight, index) =>
        target(
          `project-${item.id}-highlight-${index}`,
          `Project · ${item.name || "Untitled"} · highlight ${index + 1}`,
          { section: "projects", itemId: item.id, field: "highlight", listIndex: index },
          highlight,
        ),
      ),
    );
  }

  for (const item of data.achievements) {
    options.push(
      target(
        `achievement-${item.id}-description`,
        `Achievement · ${item.title || "Untitled"} · description`,
        { section: "achievements", itemId: item.id, field: "description", listIndex: null },
        item.description,
      ),
    );
  }

  for (const section of data.customSections) {
    for (const item of section.items) {
      options.push(
        target(
          `custom-${item.id}-description`,
          `${section.title || "Custom section"} · ${item.title || "Untitled"} · description`,
          { section: "customSections", itemId: item.id, field: "description", listIndex: null },
          item.description,
        ),
      );
    }
  }

  return options.filter((option): option is TargetOption => option !== null);
}

export function ContentImprovementPanel({
  data,
  onAccepted,
  portfolioId,
}: {
  data: PortfolioData;
  onAccepted: (content: PortfolioData, updatedAt: string) => void;
  portfolioId: string;
}) {
  const options = improvementTargets(data);
  const [selectedKey, setSelectedKey] = useState("");
  const [patch, setPatch] = useState<ContentImprovementPatch | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [isApplying, startApplying] = useTransition();
  const selected = options.find(({ key }) => key === selectedKey) ?? options[0];

  function generate() {
    if (!selected) return;
    setMessage(null);
    setPatch(null);
    startGenerating(async () => {
      try {
        const result = await generateContentImprovementAction(
          portfolioId,
          selected.target,
        );
        if (!result.success) {
          setMessage(result.message);
          return;
        }
        setPatch(result.patch);
      } catch {
        setMessage("AI suggestions are temporarily unavailable. Try again.");
      }
    });
  }

  function accept() {
    if (!patch) return;
    setMessage(null);
    startApplying(async () => {
      try {
        const result = await applyContentImprovementAction(portfolioId, patch);
        if (!result.success) {
          setMessage(result.message);
          return;
        }
        onAccepted(result.content, result.updatedAt);
        setPatch(null);
        setMessage("Suggestion accepted and saved to the draft. Republish when you are ready to update the public portfolio.");
      } catch {
        setMessage("The suggestion could not be applied. Please try again.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles aria-hidden="true" className="size-4 text-primary" />
          <CardTitle>
            <h2>Improve with AI</h2>
          </CardTitle>
        </div>
        <CardDescription className="max-w-3xl leading-6">
          AI proposes wording from existing facts. Review Original and Suggested, then explicitly accept or reject it. Published content stays unchanged until you republish.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selected ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm font-medium">
              Content to improve
              <select
                className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                onChange={(event) => {
                  setSelectedKey(event.target.value);
                  setPatch(null);
                  setMessage(null);
                }}
                value={selected.key}
              >
                {options.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <Button disabled={isGenerating || isApplying} onClick={generate} type="button">
              {isGenerating ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <Sparkles aria-hidden="true" />
              )}
              {isGenerating ? "Improving..." : "Improve with AI"}
            </Button>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Add content first. Empty fields are never sent to AI to invent from scratch.
          </p>
        )}

        <div aria-live="polite">
          {message ? <p className="rounded-lg bg-muted p-3 text-sm leading-6">{message}</p> : null}
        </div>

        {patch ? (
          <div className="space-y-4 rounded-xl border p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <section>
                <h3 className="text-sm font-semibold">Original</h3>
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm leading-6">
                  {patch.original}
                </p>
              </section>
              <section>
                <h3 className="text-sm font-semibold">Suggested</h3>
                <p className="mt-2 whitespace-pre-wrap rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm leading-6">
                  {patch.suggested}
                </p>
              </section>
            </div>
            <p className="text-sm text-muted-foreground">Why: {patch.reason}</p>
            <div className="flex flex-wrap gap-2">
              <Button disabled={isApplying} onClick={accept} type="button">
                {isApplying ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                ) : (
                  <Check aria-hidden="true" />
                )}
                {isApplying ? "Applying..." : "Accept and save"}
              </Button>
              <Button
                disabled={isApplying}
                onClick={() => {
                  setPatch(null);
                  setMessage("Suggestion rejected. Your draft was not changed.");
                }}
                type="button"
                variant="outline"
              >
                <X aria-hidden="true" />
                Reject
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
