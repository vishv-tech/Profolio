import { ArrowUpRight, Gauge } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PortfolioScore } from "@/lib/portfolio-score/score";

export function PortfolioScoreCard({ result }: { result: PortfolioScore }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gauge aria-hidden="true" className="size-4 text-primary" />
          <CardTitle><h2>Portfolio Score</h2></CardTitle>
        </div>
        <CardDescription>
          Deterministic completeness and content-quality feedback. No AI call is required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-4xl font-semibold tabular-nums">
              {result.score}<span className="text-lg text-muted-foreground">/100</span>
            </p>
            <p className="mt-1 font-medium">{result.rating}</p>
          </div>
          <div
            aria-label={`Portfolio score: ${result.score} out of 100, ${result.rating}`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={result.score}
            className="h-3 w-full overflow-hidden rounded-full bg-muted sm:max-w-sm"
            role="progressbar"
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${result.score}%` }} />
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {result.categories.map((category) => (
            <div className="rounded-lg border bg-muted/20 p-3" key={category.id}>
              <dt className="text-xs font-medium text-muted-foreground">{category.label}</dt>
              <dd className="mt-1 font-semibold tabular-nums">
                {category.score}/{category.maximum}
              </dd>
            </div>
          ))}
        </dl>

        <section>
          <h3 className="text-sm font-semibold">Top improvements</h3>
          {result.suggestions.length ? (
            <ul className="mt-3 space-y-3">
              {result.suggestions.slice(0, 5).map((item) => (
                <li className="flex gap-2 text-sm leading-6" key={item.id}>
                  <ArrowUpRight aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
                  <span>
                    <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {item.priority}
                    </span>
                    {item.message}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              This draft covers the current deterministic quality checks.
            </p>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
