import { ArrowUpRight, Gauge } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PortfolioScore } from "@/lib/portfolio-score/score";

import styles from "./portfolio-score-card.module.css";

export function PortfolioScoreCard({ result }: { result: PortfolioScore }) {
  return (
    <Card className={styles.card}>
      <CardHeader>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Profile completeness</p>
            <div className={styles.titleRow}>
              <span className={styles.icon}><Gauge aria-hidden="true" className="size-4" /></span>
              <CardTitle><h2>Portfolio score</h2></CardTitle>
            </div>
          </div>
        </div>
        <CardDescription>
          A practical view of how complete your current draft is.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={styles.scoreArea}>
          <div>
            <p className={`${styles.score} tabular-nums`}>
              {result.score}<span>/100</span>
            </p>
            <p className={styles.rating}>{result.rating}</p>
          </div>
          <div className={styles.progressWrap}>
            <span className={styles.progressLabel}><span>Current completion</span><span>{result.score}%</span></span>
            <div
            aria-label={`Portfolio score: ${result.score} out of 100, ${result.rating}`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={result.score}
            className={styles.progress}
            role="progressbar"
          >
            <div className={styles.progressBar} style={{ width: `${result.score}%` }} />
            </div>
          </div>
        </div>

        <dl className={styles.categories}>
          {result.categories.map((category) => (
            <div className={styles.category} key={category.id}>
              <dt>{category.label}</dt>
              <dd className="tabular-nums">
                {category.score}/{category.maximum}
              </dd>
            </div>
          ))}
        </dl>

        <section className={styles.improvements}>
          <h3>Recommended next steps</h3>
          {result.suggestions.length ? (
            <ul className="mt-3 space-y-3">
              {result.suggestions.slice(0, 5).map((item) => (
                <li className={styles.suggestion} key={item.id}>
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                  <span>
                    <span className={styles.priority}>
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
