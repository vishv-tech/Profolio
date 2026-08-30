import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";

const MAX_MEDIA_PAGES = 3;
const MAX_DISCOVERED_IMAGES = 30;
const MAX_PROFILE_CANDIDATES = 4;
const MEDIA_EXTRACTION_TIMEOUT_MS = 8_000;
const MAX_ENCODED_IMAGE_BYTES = 5 * 1024 * 1024;

type PdfImageData = {
  data?: ArrayLike<number>;
  height?: unknown;
  kind?: unknown;
  width?: unknown;
};

export type ExtractedResumeProfileCandidate = {
  bytes: Uint8Array;
  contentType: "image/png";
  fingerprint: string;
  height: number;
  pageNumber: number;
  score: number;
  width: number;
};

export type ResumeProfileMediaResult = {
  automaticCandidateFingerprint: string | null;
  candidates: ExtractedResumeProfileCandidate[];
  diagnostics: {
    discoveredImages: number;
    duplicateImages: number;
    pageFailures: number;
    rejectedImages: number;
  };
};

type CandidateDimensions = {
  height: number;
  pageNumber: number;
  width: number;
};

export function scoreResumeProfileCandidate({
  height,
  pageNumber,
  width,
}: CandidateDimensions): number | null {
  const pixels = width * height;
  const aspectRatio = width / height;

  if (
    width < 96 ||
    height < 96 ||
    pixels < 20_000 ||
    pixels > 4_000_000 ||
    aspectRatio < 0.5 ||
    aspectRatio > 1.5
  ) {
    return null;
  }

  // Very large page-shaped artwork is more likely a resume background than a
  // portrait. Smaller 3:4 and 4:5 images remain eligible as headshots.
  if (
    width >= 1_000 &&
    height >= 1_300 &&
    aspectRatio >= 0.68 &&
    aspectRatio <= 0.82
  ) {
    return null;
  }

  const minimumDimension = Math.min(width, height);
  const portraitDistance = Math.abs(aspectRatio - 0.8);
  let score = pageNumber === 1 ? 2 : pageNumber === 2 ? 0 : -1;

  score += minimumDimension >= 480 ? 5 : minimumDimension >= 240 ? 4 : 2;
  score +=
    portraitDistance <= 0.15
      ? 4
      : portraitDistance <= 0.3
        ? 2
        : 1;
  score += pixels <= 1_500_000 ? 1 : pixels > 2_500_000 ? -2 : 0;

  return score >= 6 ? score : null;
}

export function chooseAutomaticProfileCandidate(
  candidates: readonly Pick<ExtractedResumeProfileCandidate, "fingerprint" | "score">[],
) {
  const sorted = [...candidates].sort((left, right) => right.score - left.score);
  const best = sorted[0];

  if (!best || best.score < 10) return null;
  if (sorted.length > 1 && best.score - sorted[1].score < 3) return null;
  return best.fingerprint;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array) {
  const typeBytes = Buffer.from(type, "ascii");
  const result = Buffer.alloc(12 + data.length);
  result.writeUInt32BE(data.length, 0);
  typeBytes.copy(result, 4);
  Buffer.from(data).copy(result, 8);
  result.writeUInt32BE(
    crc32(new Uint8Array(Buffer.concat([typeBytes, Buffer.from(data)]))),
    8 + data.length,
  );
  return result;
}

function encodeRgbaPng(width: number, height: number, rgba: Uint8Array) {
  const scanlines = Buffer.alloc(height * (1 + width * 4));

  for (let row = 0; row < height; row += 1) {
    const targetOffset = row * (1 + width * 4);
    scanlines[targetOffset] = 0;
    Buffer.from(rgba.subarray(row * width * 4, (row + 1) * width * 4)).copy(
      scanlines,
      targetOffset + 1,
    );
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return new Uint8Array(
    Buffer.concat([
      signature,
      pngChunk("IHDR", header),
      pngChunk("IDAT", deflateSync(scanlines, { level: 6 })),
      pngChunk("IEND", new Uint8Array()),
    ]),
  );
}

function toByteArray(value: ArrayLike<number>) {
  if (value instanceof Uint8Array) return value;
  return Uint8Array.from(value);
}

function imageDataToRgba(
  image: PdfImageData,
  imageKinds: { grayscale: number; rgb: number; rgba: number },
) {
  const width = Number(image.width);
  const height = Number(image.height);

  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    !image.data
  ) {
    return null;
  }

  const data = toByteArray(image.data);
  const pixelCount = width * height;
  const rgba = new Uint8Array(pixelCount * 4);
  const inferredKind =
    data.length >= pixelCount * 4
      ? imageKinds.rgba
      : data.length >= pixelCount * 3
        ? imageKinds.rgb
        : imageKinds.grayscale;
  const kind = typeof image.kind === "number" ? image.kind : inferredKind;

  if (kind === imageKinds.rgba && data.length >= pixelCount * 4) {
    rgba.set(data.subarray(0, pixelCount * 4));
    return { height, rgba, width };
  }

  if (kind === imageKinds.rgb && data.length >= pixelCount * 3) {
    for (let pixel = 0; pixel < pixelCount; pixel += 1) {
      rgba[pixel * 4] = data[pixel * 3];
      rgba[pixel * 4 + 1] = data[pixel * 3 + 1];
      rgba[pixel * 4 + 2] = data[pixel * 3 + 2];
      rgba[pixel * 4 + 3] = 255;
    }
    return { height, rgba, width };
  }

  const rowBytes = Math.ceil(width / 8);
  if (kind === imageKinds.grayscale && data.length >= rowBytes * height) {
    for (let row = 0; row < height; row += 1) {
      for (let column = 0; column < width; column += 1) {
        const enabled =
          (data[row * rowBytes + Math.floor(column / 8)] &
            (1 << (7 - (column % 8)))) !==
          0;
        const value = enabled ? 255 : 0;
        const offset = (row * width + column) * 4;
        rgba[offset] = value;
        rgba[offset + 1] = value;
        rgba[offset + 2] = value;
        rgba[offset + 3] = 255;
      }
    }
    return { height, rgba, width };
  }

  return null;
}

function withTimeout<T>(promise: Promise<T>, deadline: number): Promise<T> {
  const remaining = Math.max(1, deadline - performance.now());

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Resume media extraction timed out.")),
      remaining,
    );
    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

function readPdfObject(objects: { get: (id: string, callback: (value: unknown) => void) => unknown }, id: string, deadline: number) {
  return withTimeout(
    new Promise<unknown>((resolve, reject) => {
      try {
        const immediate = objects.get(id, resolve);
        if (immediate !== undefined && immediate !== null) resolve(immediate);
      } catch (error) {
        reject(error);
      }
    }),
    deadline,
  );
}

function isPdfImageData(value: unknown): value is PdfImageData {
  return typeof value === "object" && value !== null;
}

export async function extractResumeProfileMedia(
  pdfBytes: Uint8Array,
): Promise<ResumeProfileMediaResult> {
  const startedAt = performance.now();
  const deadline = startedAt + MEDIA_EXTRACTION_TIMEOUT_MS;
  const { getDocument, ImageKind, OPS, VerbosityLevel } = await import(
    "pdfjs-dist/legacy/build/pdf.mjs"
  );
  const loadingTask = getDocument({
    data: pdfBytes.slice(),
    isEvalSupported: false,
    stopAtErrors: false,
    useWasm: false,
    useWorkerFetch: false,
    verbosity: VerbosityLevel.ERRORS,
  });
  const diagnostics = {
    discoveredImages: 0,
    duplicateImages: 0,
    pageFailures: 0,
    rejectedImages: 0,
  };
  const candidates: ExtractedResumeProfileCandidate[] = [];
  const fingerprints = new Set<string>();

  try {
    const document = await withTimeout(loadingTask.promise, deadline);
    const pageLimit = Math.min(document.numPages, MAX_MEDIA_PAGES);

    for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
      if (diagnostics.discoveredImages >= MAX_DISCOVERED_IMAGES) break;

      let page;
      try {
        page = await withTimeout(document.getPage(pageNumber), deadline);
        const operatorList = await withTimeout(page.getOperatorList(), deadline);

        for (let index = 0; index < operatorList.fnArray.length; index += 1) {
          if (diagnostics.discoveredImages >= MAX_DISCOVERED_IMAGES) break;

          const operation = operatorList.fnArray[index];
          const args = operatorList.argsArray[index] ?? [];
          let imageValue: unknown = null;

          if (
            operation === OPS.paintImageXObject ||
            operation === OPS.paintImageXObjectRepeat
          ) {
            const objectId = typeof args[0] === "string" ? args[0] : null;
            if (objectId) {
              imageValue = await readPdfObject(page.objs, objectId, deadline);
            }
          } else if (
            operation === OPS.paintInlineImageXObject ||
            operation === OPS.paintInlineImageXObjectGroup
          ) {
            imageValue = args[0];
          }

          if (!isPdfImageData(imageValue)) continue;
          diagnostics.discoveredImages += 1;
          const converted = imageDataToRgba(imageValue, {
            grayscale: ImageKind.GRAYSCALE_1BPP,
            rgb: ImageKind.RGB_24BPP,
            rgba: ImageKind.RGBA_32BPP,
          });

          if (!converted) {
            diagnostics.rejectedImages += 1;
            continue;
          }

          const score = scoreResumeProfileCandidate({
            height: converted.height,
            pageNumber,
            width: converted.width,
          });
          if (score === null) {
            diagnostics.rejectedImages += 1;
            continue;
          }

          const fingerprint = createHash("sha256")
            .update(converted.rgba)
            .digest("hex");
          if (fingerprints.has(fingerprint)) {
            diagnostics.duplicateImages += 1;
            continue;
          }

          const bytes = encodeRgbaPng(
            converted.width,
            converted.height,
            converted.rgba,
          );
          if (bytes.length > MAX_ENCODED_IMAGE_BYTES) {
            diagnostics.rejectedImages += 1;
            continue;
          }

          fingerprints.add(fingerprint);
          candidates.push({
            bytes,
            contentType: "image/png",
            fingerprint,
            height: converted.height,
            pageNumber,
            score,
            width: converted.width,
          });
        }
      } catch {
        diagnostics.pageFailures += 1;
      } finally {
        page?.cleanup();
      }
    }

    candidates.sort((left, right) => right.score - left.score);
    const limitedCandidates = candidates.slice(0, MAX_PROFILE_CANDIDATES);

    return {
      automaticCandidateFingerprint:
        chooseAutomaticProfileCandidate(limitedCandidates),
      candidates: limitedCandidates,
      diagnostics,
    };
  } finally {
    await loadingTask.destroy();
  }
}
