import { z } from "zod";

export const MAX_RESUME_BYTES = 10 * 1024 * 1024;
export const MAX_PORTFOLIO_JSON_BYTES = 1024 * 1024;
export const RESUME_BUCKET = "resumes";
export const RESUME_PROCESSING_STALE_MS = 5 * 60 * 1000;

const PDF_SIGNATURE = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
const UNSAFE_FILE_NAME = /[\u0000-\u001f\u007f/\\]/;

export const ResumeIdSchema = z.string().uuid();

type ValidatedPdf = {
  bytes: Uint8Array;
  fileName: string;
};

export type PdfValidationResult =
  | { success: true; data: ValidatedPdf }
  | { success: false; message: string };

export function hasPdfSignature(bytes: Uint8Array) {
  return (
    bytes.length >= PDF_SIGNATURE.length &&
    PDF_SIGNATURE.every((byte, index) => bytes[index] === byte)
  );
}

export async function validateResumeUpload(
  value: FormDataEntryValue | null,
): Promise<PdfValidationResult> {
  if (!(value instanceof File)) {
    return { success: false, message: "Choose a PDF resume to continue." };
  }

  const fileName = value.name.trim();
  const fileNameBytes = new TextEncoder().encode(fileName).length;

  if (
    !fileName ||
    fileNameBytes > 255 ||
    UNSAFE_FILE_NAME.test(fileName) ||
    !fileName.toLowerCase().endsWith(".pdf")
  ) {
    return { success: false, message: "Choose a valid PDF file name." };
  }

  if (value.size === 0 || value.size > MAX_RESUME_BYTES) {
    return {
      success: false,
      message: "The PDF must be larger than 0 bytes and no more than 10 MB.",
    };
  }

  if (value.type && value.type.toLowerCase() !== "application/pdf") {
    return { success: false, message: "Only PDF resumes are supported." };
  }

  const bytes = new Uint8Array(await value.arrayBuffer());

  if (!hasPdfSignature(bytes)) {
    return { success: false, message: "This file is not a valid PDF." };
  }

  return { success: true, data: { bytes, fileName } };
}

export function validateStoredPdf(bytes: Uint8Array) {
  return (
    bytes.length > 0 &&
    bytes.length <= MAX_RESUME_BYTES &&
    hasPdfSignature(bytes)
  );
}

export function isProcessingClaimStale(updatedAt: string, now = Date.now()) {
  const timestamp = Date.parse(updatedAt);

  return (
    Number.isFinite(timestamp) && now - timestamp >= RESUME_PROCESSING_STALE_MS
  );
}
