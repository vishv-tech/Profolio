export const DEMO_RESUME_MIN_PROCESSING_MS = 20_000;

type DemoDelay = (durationMs: number, signal?: AbortSignal) => Promise<void>;

function delay(durationMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error("Demo resume wait was aborted."));
      return;
    }

    const complete = () => {
      signal?.removeEventListener("abort", abort);
      resolve();
    };
    const abort = () => {
      clearTimeout(timeout);
      reject(signal?.reason ?? new Error("Demo resume wait was aborted."));
    };
    const timeout = setTimeout(complete, durationMs);

    signal?.addEventListener("abort", abort, { once: true });
  });
}

export function remainingDemoResumeDelayMs(
  startedAtMs: number,
  nowMs = performance.now(),
): number {
  return Math.max(
    0,
    DEMO_RESUME_MIN_PROCESSING_MS - Math.max(0, nowMs - startedAtMs),
  );
}

export async function waitForDemoResumeMinimum(
  startedAtMs: number,
  options: {
    delay?: DemoDelay;
    now?: () => number;
    signal?: AbortSignal;
  } = {},
): Promise<number> {
  const remainingMs = remainingDemoResumeDelayMs(
    startedAtMs,
    (options.now ?? (() => performance.now()))(),
  );

  if (remainingMs > 0) {
    await (options.delay ?? delay)(remainingMs, options.signal);
  }

  return remainingMs;
}
