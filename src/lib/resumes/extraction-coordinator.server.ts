import "server-only";

import { runSafeGeminiExtraction } from "@/lib/ai/resume-extraction";
import { runSafeDeterministicPipeline } from "@/lib/resumes/deterministic-pipeline.server";
import {
  coordinateResumeExtraction,
  type CoordinatedResumeExtractionResult,
  type ResumeExtractionSource,
} from "@/lib/resumes/extraction-coordinator";
import type { ResumeProcessingTiming } from "@/lib/resumes/timing";

export async function extractResumeWithFallback(
  pdfBytes: Uint8Array,
  improveWithAi: boolean,
  timing?: ResumeProcessingTiming,
): Promise<CoordinatedResumeExtractionResult> {
  const branchStarts = new Map<ResumeExtractionSource, number>();
  const result = await coordinateResumeExtraction({
    improveWithAi,
    onBranchStart: (source) => {
      branchStarts.set(source, performance.now());

      if (branchStarts.size === 2) {
        const deterministicStart = branchStarts.get("deterministic") ?? 0;
        const geminiStart = branchStarts.get("gemini") ?? 0;
        const startGapMs = Math.abs(geminiStart - deterministicStart);
        timing?.record("parallel-start", startGapMs, "branches-started");

        if (process.env.NODE_ENV === "development") {
          console.info("[resume-extraction]", {
            stage: "parallel-start",
            startGapMs: Math.max(0, Math.round(startGapMs)),
          });
        }
      }
    },
    pdfBytes,
    runDeterministic: (bytes) =>
      runSafeDeterministicPipeline(bytes, { timing }),
    runGemini: (bytes, improve) =>
      runSafeGeminiExtraction(bytes, improve, { timing }),
  });

  if (process.env.NODE_ENV === "development") {
    console.info("[resume-extraction]", {
      stage: "winner-selection",
      source: result.success ? result.source : "none",
      ...(result.success && result.model ? { model: result.model } : {}),
    });
  }

  timing?.record(
    "winner-selection",
    0,
    result.success ? result.source : "all-extraction-failed",
  );
  return result;
}
