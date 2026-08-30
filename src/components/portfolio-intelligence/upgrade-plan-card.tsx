"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateUpgradePlanAction } from "@/lib/portfolio-intelligence/actions";
import type { PortfolioUpgradePlan } from "@/lib/portfolio-intelligence/schemas";

export function UpgradePlanCard({ portfolioId }: { portfolioId: string }) {
  const [plan, setPlan] = useState<PortfolioUpgradePlan | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function generatePlan() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await generateUpgradePlanAction(portfolioId);
        if (!result.success) {
          setMessage(result.message);
          return;
        }
        setPlan(result.plan);
      } catch {
        setMessage("AI suggestions are temporarily unavailable. Try again.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles aria-hidden="true" className="size-4 text-primary" />
            <CardTitle>
              <h2>AI Upgrade Plan</h2>
            </CardTitle>
          </div>
          <CardDescription className="mt-2 max-w-2xl leading-6">
            Generate optional advice from your current draft and deterministic score. Nothing is changed automatically.
          </CardDescription>
        </div>
        <Button disabled={isPending} onClick={generatePlan} type="button">
          {isPending ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <Sparkles aria-hidden="true" />
          )}
          {isPending ? "Generating..." : plan ? "Regenerate plan" : "Generate Upgrade Plan"}
        </Button>
      </CardHeader>
      <CardContent>
        <div aria-live="polite">
          {message ? (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
              {message}
            </p>
          ) : null}
        </div>

        {plan ? (
          <div className="space-y-6">
            <p className="text-sm leading-6 text-muted-foreground">{plan.overview}</p>

            <section>
              <h3 className="text-sm font-semibold">Strengths</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
                {plan.strengths.map((strength) => (
                  <li key={strength}>{strength}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-sm font-semibold">Priority improvements</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {plan.priorities.map((priority) => (
                  <article className="rounded-lg border p-3" key={`${priority.area}-${priority.title}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {priority.priority} priority · {priority.area}
                    </p>
                    <h4 className="mt-1 font-semibold">{priority.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{priority.reason}</p>
                    <p className="mt-2 text-sm leading-6">{priority.recommendation}</p>
                  </article>
                ))}
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-3">
              <PlanList title="Skills positioning" values={plan.skillSuggestions} />
              <PlanList title="Project ideas to explore" values={plan.projectIdeas} />
              <PlanList title="Certifications to explore" values={plan.certificationIdeas} />
            </div>
            <PlanList title="Professional presence" values={plan.professionalPresence} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            AI is called only when you choose Generate Upgrade Plan. Your score and workspace remain available if AI is offline.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PlanList({ title, values }: { title: string; values: string[] }) {
  if (values.length === 0) return null;

  return (
    <section className="rounded-lg border bg-muted/20 p-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </section>
  );
}
