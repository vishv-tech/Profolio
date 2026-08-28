import assert from "node:assert/strict";
import test from "node:test";

import {
  hasPdfSignature,
  isProcessingClaimStale,
  MAX_RESUME_BYTES,
  validateResumeUpload,
} from "@/lib/resumes/validation";

const MINIMAL_PDF = new TextEncoder().encode(
  "%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF",
);

test("accepts a PDF with valid metadata and magic bytes", async () => {
  const file = new File([MINIMAL_PDF], "resume.pdf", {
    type: "application/pdf",
  });
  const result = await validateResumeUpload(file);

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.fileName, "resume.pdf");
    assert.equal(hasPdfSignature(result.data.bytes), true);
  }
});

test("rejects a renamed non-PDF before Storage upload", async () => {
  const file = new File(["plain text"], "resume.pdf", {
    type: "application/pdf",
  });
  const result = await validateResumeUpload(file);

  assert.deepEqual(result, {
    success: false,
    message: "This file is not a valid PDF.",
  });
});

test("rejects unsafe names, incorrect MIME, empty, and oversized files", async () => {
  const unsafe = await validateResumeUpload(
    new File([MINIMAL_PDF], "../resume.pdf", { type: "application/pdf" }),
  );
  const mime = await validateResumeUpload(
    new File([MINIMAL_PDF], "resume.pdf", { type: "text/plain" }),
  );
  const empty = await validateResumeUpload(
    new File([], "resume.pdf", { type: "application/pdf" }),
  );
  const oversized = await validateResumeUpload(
    new File([new Uint8Array(MAX_RESUME_BYTES + 1)], "resume.pdf", {
      type: "application/pdf",
    }),
  );

  assert.equal(unsafe.success, false);
  assert.equal(mime.success, false);
  assert.equal(empty.success, false);
  assert.equal(oversized.success, false);
});

test("only considers processing claims stale after the recovery window", () => {
  const now = Date.parse("2026-08-28T10:05:00.000Z");

  assert.equal(
    isProcessingClaimStale("2026-08-28T10:01:00.001Z", now),
    false,
  );
  assert.equal(
    isProcessingClaimStale("2026-08-28T10:00:00.000Z", now),
    true,
  );
  assert.equal(isProcessingClaimStale("invalid", now), false);
});
