import assert from "node:assert/strict";
import test from "node:test";

import { runSafeDeterministicPipeline } from "@/lib/resumes/deterministic-pipeline";
import { coordinateResumeExtraction } from "@/lib/resumes/extraction-coordinator";
import { parseResumePdf } from "@/lib/resumes/resume-source";
import { PortfolioDataSchema } from "@/lib/validation/portfolio";

function pdfObject(id: number, body: string) {
  return Buffer.from(`${id} 0 obj\n${body}\nendobj\n`, "ascii");
}

function createTextResumePdf(lines: readonly string[]) {
  const escapePdfText = (value: string) =>
    value.replace(/([\\()])/gu, "\\$1");
  const content = [
    "BT",
    "/F1 12 Tf",
    "72 720 Td",
    ...lines.flatMap((line, index) => [
      ...(index > 0 ? ["0 -18 Td"] : []),
      `(${escapePdfText(line)}) Tj`,
    ]),
    "ET",
  ].join("\n");
  const objects = [
    pdfObject(1, "<< /Type /Catalog /Pages 2 0 R >>"),
    pdfObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    pdfObject(
      3,
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    ),
    pdfObject(
      4,
      `<< /Length ${Buffer.byteLength(content, "ascii")} >>\nstream\n${content}\nendstream`,
    ),
    pdfObject(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
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

const SYNTHETIC_RESUME_PDF = createTextResumePdf([
  "Avery Student",
  "avery.student@example.test | +1 202 555 0142",
  "Location: Austin, Texas",
  "PROFESSIONAL SUMMARY",
  "Software developer focused on reliable and accessible web products.",
  "EDUCATION",
  "Institution: Example Institute",
  "Degree: Bachelor of Technology",
  "PROJECTS",
  "Project: Campus Planner",
  "Description: Scheduling tool for student teams",
  "TECHNICAL SKILLS",
  "Languages: TypeScript, React, Node.js, SQL, testing, Git, accessibility",
]);

test("parses useful text from a synthetic resume PDF without a copied worker", async () => {
  const result = await parseResumePdf(SYNTHETIC_RESUME_PDF);

  assert.equal(result.pageCount, 1);
  assert.deepEqual(result.diagnostics, {
    pageFailures: 0,
    textPageFailures: 0,
  });
  assert.match(result.text, /Avery Student/u);
  assert.match(result.text, /avery\.student@example\.test/u);
  assert.match(result.text, /Campus Planner/u);
});

test("creates schema-valid deterministic PortfolioData from a real text PDF", async () => {
  const result = await runSafeDeterministicPipeline(SYNTHETIC_RESUME_PDF);

  assert.equal(result.success, true);

  if (!result.success) {
    return;
  }

  assert.equal(PortfolioDataSchema.safeParse(result.data).success, true);
  assert.equal(result.data.personal.fullName, "Avery Student");
  assert.equal(result.data.personal.email, "avery.student@example.test");
  assert.equal(result.data.personal.phone, "+1 202 555 0142");
  assert.equal(result.data.education[0].institution, "Example Institute");
  assert.equal(result.data.projects[0].name, "Campus Planner");
  assert.deepEqual(result.data.skills[0].items, [
    "TypeScript",
    "React",
    "Node.js",
    "SQL",
    "testing",
    "Git",
    "accessibility",
  ]);
});

test("all-AI-fail still selects deterministic data from the uploaded PDF", async () => {
  const result = await coordinateResumeExtraction({
    improveWithAi: true,
    pdfBytes: SYNTHETIC_RESUME_PDF,
    runDeterministic: (bytes) => runSafeDeterministicPipeline(bytes),
    runGemini: async () => ({
      success: false,
      source: "gemini",
      reason: "unavailable",
    }),
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.source, "deterministic");
    assert.equal(result.data.personal.fullName, "Avery Student");
    assert.equal(PortfolioDataSchema.safeParse(result.data).success, true);
  }
});
