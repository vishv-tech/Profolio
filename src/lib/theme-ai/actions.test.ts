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

test("Theme Engine actions reauthorize active owners and require a supported saved theme", () => {
  const actions = source("../../app/themes/theme-studio-actions.ts");

  assert.ok((actions.match(/requireActiveUser\(\)/g) ?? []).length >= 3);
  assert.match(actions, /\.eq\("id", portfolioId\)/);
  assert.match(actions, /\.eq\("user_id", userId\)/);
  assert.match(actions, /portfolioResult\.data\.theme_id/);
  assert.match(actions, /selectedTheme\?\.id !== portfolioResult\.data\.theme_id/);
  assert.match(actions, /isUniqueActiveCodedTheme/);
  assert.match(actions, /isAiThemeEngineSupported/);
  assert.match(actions, /\.eq\("updated_at", input\.updatedAt\)/);
  assert.doesNotMatch(actions, /getSession\(/);
});

test("Theme Engine persistence changes only validated theme_config", () => {
  const actions = source("../../app/themes/theme-studio-actions.ts");
  const update = actions.match(
    /async function persistThemeConfig[\s\S]*?function invalidThemeStudioResult/,
  )?.[0];

  assert.ok(update);
  assert.match(update, /\.update\(\{ theme_config: toDatabaseJson\(input\.config\) \}\)/);
  assert.doesNotMatch(update, /draft_content|published_content|theme_id:\s|slug|status:/);
  assert.match(actions, /themeConfigsEqual\(state\.config, expectedConfig\.data\)/);
  assert.match(actions, /if \(!saved\)/);
  assert.doesNotMatch(actions, /publishPortfolio|router\.refresh|router\.push/);
});

test("Gemini remains server-only, single-model, and absent from the client graph", () => {
  const gemini = source("./gemini.ts");
  const schema = source("./schema.ts");
  const service = source("./service.ts");
  const studio = source("../../app/themes/ThemeStudio.tsx");
  const actions = source("../../app/themes/theme-studio-actions.ts");

  assert.match(gemini, /import "server-only"/);
  assert.match(gemini, /process\.env\.GEMINI_API_KEY/);
  assert.doesNotMatch(gemini, /NEXT_PUBLIC_/);
  assert.match(gemini, /model: THEME_STUDIO_MODEL/);
  assert.match(schema, /THEME_STUDIO_MODEL\s*=\s*"gemini-3\.5-flash"/);
  assert.doesNotMatch(schema, /flash-lite|groq/iu);
  assert.doesNotMatch(gemini, /requestWithGeminiAvailabilityFallback|GEMINI_RESUME_MODELS/);
  assert.doesNotMatch(studio, /theme-ai\/gemini|GEMINI_API_KEY/);
  assert.match(actions, /generateStructuredThemeStyle/);
  assert.ok(
    service.indexOf("interpretDeterministicThemeInstruction") <
      service.indexOf("await generate("),
  );
});

test("Theme Engine is capability-gated, drawer-based, and reconciles locally", () => {
  const store = source("../../app/themes/ThemeStore.tsx");
  const storeStyles = source("../../app/themes/ThemeStore.module.css");
  const studio = source("../../app/themes/ThemeStudio.tsx");
  const studioStyles = source("../../app/themes/ThemeStudio.module.css");

  assert.match(store, /selectedIsSaved && selectedSupportsThemeEngine \? \(/);
  assert.match(store, /isAiThemeEngineSupported/);
  assert.match(store, /aria-controls="ai-theme-engine-drawer"/);
  assert.match(store, /themeEngineOpen && styles\.previewWorkspaceWithEngine/);
  assert.match(store, /onClose=\{closeThemeEngine\}/);
  assert.match(store, /onConfigSaved=\{reconcileThemeStudioConfig\}/);
  assert.match(store, /setConfigOverrides/);
  assert.doesNotMatch(studio, /router\.(?:refresh|push|replace)/);
  assert.match(studio, /undoPortfolioThemeCustomization/);
  assert.match(studio, /resetPortfolioThemeCustomization/);
  assert.match(studio, /aria-live="polite"/);
  assert.match(studio, /onKeyDown=\{handleComposerKeyDown\}/);
  assert.match(studio, /hidden=\{!open\}/);
  assert.match(studio, /disabled=\{isPending \|\| !input\.trim\(\)\}/);
  assert.match(studio, /"More rounded"/);
  assert.match(storeStyles, /\.previewWorkspace\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(storeStyles, /\.previewWorkspaceWithEngine\s*\{[\s\S]*?390px minmax\(0, 1fr\)/);
  assert.match(studioStyles, /\.studio\s*\{[\s\S]*?display:\s*none/);
  assert.match(studioStyles, /\.studioOpen\s*\{[\s\S]*?display:\s*flex/);
  assert.match(studioStyles, /@media \(max-width: 920px\)[\s\S]*?position:\s*absolute/);
});

test("failed generation or persistence cannot update the live preview", () => {
  const studio = source("../../app/themes/ThemeStudio.tsx");
  const sendStart = studio.indexOf("  function sendInstruction(");
  const sendEnd = studio.indexOf("\n  function submitInstruction", sendStart);
  const sendHandler = studio.slice(sendStart, sendEnd);

  assert.match(sendHandler, /if \(!result\.success\)[\s\S]*?return/);
  assert.match(sendHandler, /if \(result\.applied\)[\s\S]*?onConfigSaved/);
  assert.doesNotMatch(
    sendHandler.slice(0, sendHandler.indexOf("const result =")),
    /onConfigSaved/,
  );
});
