import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  chooseAutomaticProfileCandidate,
  extractResumeProfileMedia,
  scoreResumeProfileCandidate,
} from "@/lib/resumes/media";

type SyntheticImage = {
  height: number;
  seed: number;
  width: number;
};

function rgbImage({ height, seed, width }: SyntheticImage) {
  const bytes = Buffer.alloc(width * height * 3);

  for (let offset = 0; offset < bytes.length; offset += 3) {
    const pixel = offset / 3;
    bytes[offset] = (seed + pixel) % 256;
    bytes[offset + 1] = (seed * 3 + Math.floor(pixel / width)) % 256;
    bytes[offset + 2] = (seed * 7 + (pixel % width)) % 256;
  }

  return bytes;
}

function pdfObject(id: number, body: Buffer | string) {
  return Buffer.concat([
    Buffer.from(`${id} 0 obj\n`, "ascii"),
    typeof body === "string" ? Buffer.from(body, "ascii") : body,
    Buffer.from("\nendobj\n", "ascii"),
  ]);
}

function streamObject(dictionary: string, bytes: Buffer) {
  return Buffer.concat([
    Buffer.from(`<< ${dictionary} /Length ${bytes.length} >>\nstream\n`, "ascii"),
    bytes,
    Buffer.from("\nendstream", "ascii"),
  ]);
}

function createSyntheticPdf(images: SyntheticImage[], drawOrder?: number[]) {
  const imageNames = images.map((_, index) => `/Im${index} ${5 + index} 0 R`);
  const draws = drawOrder ?? images.map((_, index) => index);
  const content = Buffer.from(
    draws
      .map((imageIndex, drawIndex) => {
        const image = images[imageIndex];
        return `q ${image.width} 0 0 ${image.height} 36 ${720 - drawIndex * 180} cm /Im${imageIndex} Do Q`;
      })
      .join("\n"),
    "ascii",
  );
  const objects = [
    pdfObject(1, "<< /Type /Catalog /Pages 2 0 R >>"),
    pdfObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    pdfObject(
      3,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << ${imageNames.join(" ")} >> >> /Contents 4 0 R >>`,
    ),
    pdfObject(4, streamObject("", content)),
    ...images.map((image, index) =>
      pdfObject(
        5 + index,
        streamObject(
          `/Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8`,
          rgbImage(image),
        ),
      ),
    ),
  ];
  const header = Buffer.from("%PDF-1.4\n%\xff\xff\xff\xff\n", "latin1");
  const offsets: number[] = [0];
  let offset = header.length;

  for (const object of objects) {
    offsets.push(offset);
    offset += object.length;
  }

  const xrefOffset = offset;
  const xref = [
    `xref\n0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets
      .slice(1)
      .map((value) => `${String(value).padStart(10, "0")} 00000 n `),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    `startxref\n${xrefOffset}`,
    "%%EOF\n",
  ].join("\n");

  return new Uint8Array(
    Buffer.concat([header, ...objects, Buffer.from(xref, "ascii")]),
  );
}

test("PDF without embedded images produces no profile candidate", async () => {
  const result = await extractResumeProfileMedia(createSyntheticPdf([]));

  assert.equal(result.candidates.length, 0);
  assert.equal(result.automaticCandidateFingerprint, null);
  assert.equal(result.diagnostics.discoveredImages, 0);
});

test("tiny embedded icon is discovered but rejected", async () => {
  const pdf = createSyntheticPdf([{ height: 16, seed: 1, width: 16 }]);
  const result = await extractResumeProfileMedia(
    pdf,
  );

  assert.equal(
    result.diagnostics.pageFailures,
    0,
    JSON.stringify(result.diagnostics),
  );
  assert.equal(result.candidates.length, 0);
  assert.equal(result.automaticCandidateFingerprint, null);
  assert.equal(result.diagnostics.discoveredImages, 1);
  assert.equal(result.diagnostics.rejectedImages, 1);
});

test("plausible embedded portrait is extracted as a PNG candidate", async () => {
  const result = await extractResumeProfileMedia(
    createSyntheticPdf([{ height: 300, seed: 11, width: 240 }]),
  );

  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].width, 240);
  assert.equal(result.candidates[0].height, 300);
  assert.equal(result.candidates[0].contentType, "image/png");
  assert.deepEqual(
    [...result.candidates[0].bytes.slice(0, 8)],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  );
  assert.equal(
    result.automaticCandidateFingerprint,
    result.candidates[0].fingerprint,
  );
});

test("multiple equally plausible images remain a manual choice", async () => {
  const result = await extractResumeProfileMedia(
    createSyntheticPdf([
      { height: 300, seed: 21, width: 240 },
      { height: 325, seed: 37, width: 260 },
    ]),
  );

  assert.equal(result.candidates.length, 2);
  assert.equal(result.automaticCandidateFingerprint, null);
  assert.equal(result.candidates[0].score, result.candidates[1].score);
});

test("duplicate image operations are deduplicated", async () => {
  const result = await extractResumeProfileMedia(
    createSyntheticPdf([{ height: 300, seed: 44, width: 240 }], [0, 0]),
  );

  assert.equal(result.diagnostics.discoveredImages, 2);
  assert.equal(result.diagnostics.duplicateImages, 1);
  assert.equal(result.candidates.length, 1);
});

test("candidate filters and automatic selection stay conservative", () => {
  assert.equal(
    scoreResumeProfileCandidate({ height: 16, pageNumber: 1, width: 16 }),
    null,
  );
  assert.equal(
    scoreResumeProfileCandidate({ height: 1_400, pageNumber: 1, width: 1_000 }),
    null,
  );
  assert.equal(
    chooseAutomaticProfileCandidate([
      { fingerprint: "first", score: 11 },
      { fingerprint: "second", score: 9 },
    ]),
    null,
  );
  assert.equal(
    chooseAutomaticProfileCandidate([
      { fingerprint: "first", score: 11 },
      { fingerprint: "second", score: 8 },
    ]),
    "first",
  );
});

test("resume processing keeps media extraction behind a non-blocking boundary", () => {
  const source = readFileSync("src/app/upload/actions.ts", "utf8");
  const aiIndex = source.indexOf("extractPortfolioFromPdf(");
  const mediaIndex = source.lastIndexOf("addBestEffortProfileMedia({");
  const databaseIndex = source.indexOf('"database-write"', mediaIndex);

  assert.equal(aiIndex >= 0, true);
  assert.equal(mediaIndex > aiIndex, true);
  assert.equal(databaseIndex > mediaIndex, true);
  assert.match(source, /async function addBestEffortProfileMedia[\s\S]*?try \{[\s\S]*?extractResumeProfileMedia[\s\S]*?catch \{[\s\S]*?return \{ automaticProfileImageUrl: "", candidates: \[\] \}/u);
  assert.match(source, /Profile media is optional[\s\S]*?failed resume/u);
});
