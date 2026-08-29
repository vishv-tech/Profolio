import assert from "node:assert/strict";
import test from "node:test";

import { cleanResumeText, isUsableResumeText } from "@/lib/resumes/text";

test("cleans parser whitespace and control noise without rewriting facts", () => {
  const cleaned = cleanResumeText(
    "  Avery\u0000  Student\r\n\r\n\r\n  Built\tReact products in 2025.  ",
  );

  assert.equal(cleaned, "Avery Student\n\nBuilt React products in 2025.");
});

test("uses complete readable text and rejects empty, garbled, or excessive text", () => {
  const readable = `
    Avery Student is a software developer focused on reliable web products.
    Experience includes building accessible interfaces, testing services,
    collaborating with designers, reviewing code, and documenting systems.
    Skills include TypeScript, React, Node.js, SQL, testing, and Git.
  `;
  const garbled = `${"�".repeat(20)} ${"word ".repeat(30)}`;

  assert.equal(isUsableResumeText(cleanResumeText(readable)), true);
  assert.equal(isUsableResumeText(""), false);
  assert.equal(isUsableResumeText(garbled), false);
  assert.equal(isUsableResumeText("a".repeat(80_001)), false);
});
