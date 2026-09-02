import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

function source(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(relativePath, import.meta.url)),
    "utf8",
  );
}

test("resume processing keeps the required ordered status sequence", () => {
  const workflow = source("../../components/upload/resume-workflow.tsx");
  const sequence = workflow.match(
    /const PROCESSING_STAGES\s*=\s*\[([\s\S]*?)\]\s*as const/,
  );

  assert.ok(sequence);
  assert.deepEqual(
    [...sequence[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]),
    [
      "Resume uploaded",
      "Reading resume",
      "Identifying experience",
      "Organizing projects",
      "Extracting skills",
      "Preparing portfolio",
    ],
  );
  assert.match(workflow, /PROCESSING_STAGE_FADE_MS\s*=\s*400/);
  assert.match(workflow, /PROCESSING_STAGE_VISIBLE_MS\s*=\s*2_800/);
  assert.match(workflow, /PROCESSING_STAGE_INTERVAL_MS/);
  assert.match(workflow, /Math\.min\(current \+ 1, PROCESSING_STAGES\.length - 1\)/);
});

test("ProcessingCard uses one polite status without a circular loader", () => {
  const workflow = source("../../components/upload/resume-workflow.tsx");
  const styles = source("../../components/upload/resume-workflow.module.css");
  const processingCard = workflow.slice(workflow.indexOf("function ProcessingCard"));

  assert.match(processingCard, /Analyzing your resume\.\.\./);
  assert.match(processingCard, /aria-live="polite"/);
  assert.match(processingCard, /aria-atomic="true"/);
  assert.doesNotMatch(processingCard, /LoaderCircle/);
  assert.doesNotMatch(processingCard, /setInterval|clearInterval/);
  assert.match(processingCard, /clearTimeout\(fadeOutTimeout\)/);
  assert.match(processingCard, /clearTimeout\(advanceTimeout\)/);
  assert.match(styles, /\.processingStatus\s*\{[\s\S]*?min-height:/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(
    workflow,
    /resume\?\.status === "uploaded" \|\| resume\?\.status === "processing"/,
  );
});
