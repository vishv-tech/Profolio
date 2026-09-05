import assert from "node:assert/strict";
import test from "node:test";

import {
  parseThemeAiResponse,
  THEME_AI_RESPONSE_JSON_SCHEMA,
  ThemeStylePatchSchema,
} from "./schema";

test("accepts and normalizes safe visual patches", () => {
  const response = parseThemeAiResponse(
    JSON.stringify({
      kind: "style",
      patch: {
        backgroundColor: "#0F172A",
        accentColor: "#2563EB",
        fontFamily: "Inter",
        headingFontFamily: "Playfair Display",
        headingScale: "large",
        spacing: "spacious",
        borderRadius: 24,
        animationIntensity: "subtle",
      },
    }),
  );

  assert.deepEqual(response, {
    kind: "style",
    patch: {
      backgroundColor: "#0f172a",
      accentColor: "#2563eb",
      fontFamily: "Inter",
      headingFontFamily: "Playfair Display",
      headingScale: "large",
      spacing: "spacious",
      borderRadius: 24,
      animationIntensity: "subtle",
    },
  });
  assert.ok(JSON.stringify(THEME_AI_RESPONSE_JSON_SCHEMA).length > 0);
});

test("accepts an explicit unsupported response without a patch", () => {
  assert.deepEqual(
    parseThemeAiResponse('{"kind":"unsupported","patch":null}'),
    { kind: "unsupported", patch: null },
  );
});

test("rejects unknown fields, code, URLs, unsafe colors, fonts, and enums", () => {
  const invalidPatches = [
    {},
    { layoutKey: "pavni-noir-creator" },
    { slug: "changed" },
    { publish: true },
    { backgroundColor: "url(https://example.test/image.png)" },
    { backgroundColor: "javascript:alert(1)" },
    { backgroundColor: "https://example.test" },
    { backgroundColor: "var(--secret)" },
    { backgroundColor: "#fff" },
    { backgroundColor: "#123456; color: red" },
    { fontFamily: "https://fonts.example.test/custom.woff2" },
    { fontFamily: "Comic Sans MS" },
    { headingScale: "huge" },
    { spacing: "maximum" },
    { animationIntensity: "infinite" },
    { borderRadius: 99 },
    { css: "body { display: none }" },
    { script: "document.body.remove()" },
  ];

  for (const patch of invalidPatches) {
    assert.equal(
      ThemeStylePatchSchema.safeParse(patch).success,
      false,
      JSON.stringify(patch),
    );
  }
});

test("rejects executable or out-of-scope AI response shapes", () => {
  for (const response of [
    { kind: "style", patch: { layoutKey: "career-ai-data" } },
    { kind: "style", patch: { projectDescription: "Rewritten" } },
    { kind: "style", patch: { code: "console.log('secret')" } },
    { kind: "unsupported", patch: { accentColor: "#123456" } },
    { kind: "style", patch: null },
  ]) {
    assert.equal(parseThemeAiResponse(JSON.stringify(response)), null);
  }
});
