import assert from "node:assert/strict";
import test from "node:test";

import { parseResumePdf } from "@/lib/resumes/resume-source";

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

test("parses useful text from a synthetic resume PDF without a copied worker", async () => {
  const result = await parseResumePdf(
    createTextResumePdf([
      "Avery Student",
      "avery.student@example.test | +1 202 555 0142",
      "Professional Summary",
      "Software developer focused on reliable and accessible web products.",
      "Education: Example Institute, Bachelor of Technology, 2021 - 2025",
      "Projects: Campus Planner built with TypeScript, React, and PostgreSQL",
      "Skills: TypeScript, React, Node.js, SQL, testing, Git, accessibility",
    ]),
  );

  assert.equal(result.pageCount, 1);
  assert.deepEqual(result.diagnostics, {
    annotationPageFailures: 0,
    pageFailures: 0,
    textPageFailures: 0,
  });
  assert.match(result.text, /Avery Student/u);
  assert.match(result.text, /avery\.student@example\.test/u);
  assert.match(result.text, /Campus Planner/u);
  assert.equal(result.useTextForGemini, true);
});
