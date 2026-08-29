type TimingOutcome = "failed" | "rejected" | "success";

type TimingEntry = {
  durationMs: number;
  outcome: string;
  stage: string;
};

export class ResumeProcessingTiming {
  private readonly entries: TimingEntry[] = [];
  private readonly startedAt = performance.now();
  private finished = false;

  constructor(private readonly operation: "resume-processing" | "resume-upload") {}

  record(stage: string, durationMs: number, outcome = "success") {
    this.entries.push({
      durationMs: Math.max(0, Math.round(durationMs)),
      outcome,
      stage,
    });
  }

  async measure<TValue>(stage: string, operation: () => PromiseLike<TValue>) {
    const startedAt = performance.now();

    try {
      const value = await operation();
      this.record(stage, performance.now() - startedAt);
      return value;
    } catch (error) {
      this.record(stage, performance.now() - startedAt, "failed");
      throw error;
    }
  }

  measureSync<TValue>(stage: string, operation: () => TValue) {
    const startedAt = performance.now();

    try {
      const value = operation();
      this.record(stage, performance.now() - startedAt);
      return value;
    } catch (error) {
      this.record(stage, performance.now() - startedAt, "failed");
      throw error;
    }
  }

  finish(outcome: TimingOutcome) {
    if (this.finished) {
      return;
    }

    this.finished = true;

    if (process.env.NODE_ENV !== "development") {
      return;
    }

    console.info("[resume-timing]", {
      operation: this.operation,
      outcome,
      stages: this.entries,
      totalMs: Math.max(0, Math.round(performance.now() - this.startedAt)),
    });
  }
}
