import assert from "node:assert/strict";
import test from "node:test";

import { defaultThemeConfig } from "@/themes/default-config";

import { interpretDeterministicThemeInstruction } from "./deterministic";
import {
  THEME_AI_RESPONSE_JSON_SCHEMA,
  ThemeStylePatchSchema,
} from "./schema";
import { generateThemeStyleInterpretation } from "./service";

const studioInput = {
  currentAppearance: defaultThemeConfig.appearance,
  layoutKey: "pavni-professional-editorial",
  themeName: "Professional Editorial",
};

const chipExpectations = {
  "Dark & modern": { colorMode: "dark", backgroundColor: "#0f172a" },
  "Professional blue": { accentColor: "#2563eb" },
  "Minimal & clean": { animationIntensity: "none" },
  "Larger headings": { headingScale: "large" },
  "More rounded": { borderRadius: 24 },
  "More spacious": { spacing: "spacious" },
} as const;

for (const [instruction, expected] of Object.entries(chipExpectations)) {
  test(`${instruction} is a valid deterministic chip with zero Gemini calls`, async () => {
    let calls = 0;
    const result = await generateThemeStyleInterpretation(
      { ...studioInput, instruction },
      async () => {
        calls += 1;
        return '{"kind":"unsupported","patch":null}';
      },
      THEME_AI_RESPONSE_JSON_SCHEMA,
    );

    assert.equal(calls, 0);
    assert.equal(result?.kind, "style");
    if (result?.kind !== "style") return;
    assert.equal(ThemeStylePatchSchema.safeParse(result.patch).success, true);
    assert.deepEqual({ ...result.patch, ...expected }, result.patch);
  });
}

for (const [instruction, property, expected] of [
  ["change background to red", "backgroundColor", "#7f1d1d"],
  ["make the background dark blue", "backgroundColor", "#172554"],
  ["change accent to purple", "accentColor", "#7e22ce"],
  ["make the text white", "textColor", "#ffffff"],
] as const) {
  test(`${instruction} uses the deterministic color dictionary`, async () => {
    let calls = 0;
    const result = await generateThemeStyleInterpretation(
      { ...studioInput, instruction },
      async () => {
        calls += 1;
        return '{"kind":"unsupported","patch":null}';
      },
      THEME_AI_RESPONSE_JSON_SCHEMA,
    );

    assert.equal(calls, 0);
    assert.equal(result?.kind, "style");
    if (result?.kind !== "style") return;
    assert.equal(result.patch[property], expected);
  });
}

test("supported size, spacing, radius, mode, and motion commands are deterministic", () => {
  for (const instruction of [
    "make headings smaller",
    "less rounded",
    "make it compact",
    "dark mode",
    "light mode",
    "remove animations",
    "use subtle animations",
  ]) {
    const result = interpretDeterministicThemeInstruction(instruction);
    assert.equal(result?.kind, "style", instruction);
    if (result?.kind === "style") {
      assert.equal(ThemeStylePatchSchema.safeParse(result.patch).success, true);
    }
  }
});

test("every supported named color resolves to explicit six-digit hex values", () => {
  for (const color of [
    "red",
    "blue",
    "dark blue",
    "navy",
    "black",
    "white",
    "gray",
    "grey",
    "purple",
    "pink",
    "green",
    "orange",
    "beige",
  ]) {
    const result = interpretDeterministicThemeInstruction(
      `change accent to ${color}`,
    );
    assert.equal(result?.kind, "style", color);
    if (result?.kind === "style") {
      assert.match(result.patch.accentColor ?? "", /^#[\da-f]{6}$/u);
    }
  }
});

test("an ambiguous luxury editorial instruction is sent to Gemini", async () => {
  let calls = 0;
  const result = await generateThemeStyleInterpretation(
    {
      ...studioInput,
      instruction:
        "Make this feel like a luxury creative developer portfolio with warm editorial styling.",
    },
    async () => {
      calls += 1;
      return '{"kind":"style","patch":{"headingFontFamily":"Playfair Display","spacing":"spacious"}}';
    },
    THEME_AI_RESPONSE_JSON_SCHEMA,
  );

  assert.equal(calls, 1);
  assert.deepEqual(result, {
    kind: "style",
    patch: { headingFontFamily: "Playfair Display", spacing: "spacious" },
  });
});

test("Gemini failure applies only the recognizable safe subset", async () => {
  let calls = 0;
  const result = await generateThemeStyleInterpretation(
    {
      ...studioInput,
      instruction: "Make the background red with a polished feel.",
    },
    async () => {
      calls += 1;
      throw new Error("provider unavailable");
    },
    THEME_AI_RESPONSE_JSON_SCHEMA,
  );

  assert.equal(calls, 1);
  assert.equal(result?.kind, "style");
  if (result?.kind === "style") {
    assert.equal(result.patch.backgroundColor, "#7f1d1d");
  }
});

test("Gemini failure on an ambiguous request returns no mutation", async () => {
  let calls = 0;

  await assert.rejects(
    generateThemeStyleInterpretation(
      {
        ...studioInput,
        instruction: "Give this a premium editorial technology aesthetic.",
      },
      async () => {
        calls += 1;
        throw new Error("provider unavailable");
      },
      THEME_AI_RESPONSE_JSON_SCHEMA,
    ),
    /provider unavailable/,
  );
  assert.equal(calls, 1);
});

test("content, layout, and publish requests never use deterministic fallback", () => {
  for (const instruction of [
    "change project content and make the background red",
    "change the layout and background red",
    "publish with a blue background",
  ]) {
    assert.equal(
      interpretDeterministicThemeInstruction(instruction, {
        allowRecognizedSubset: true,
      }),
      null,
    );
  }
});
