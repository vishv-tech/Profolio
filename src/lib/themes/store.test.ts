import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { allThemePack } from "@/themes/registry";
import { defaultThemeConfig, resolveThemeConfig } from "@/themes/default-config";

import { buildThemeStoreCatalog, resolveThemeLayoutKey } from "./store";

test("builds the production catalog from every unified registry manifest", () => {
  const catalog = buildThemeStoreCatalog({
    databaseThemes: [],
    savedThemeConfig: {},
    savedThemeId: null,
  });

  assert.equal(catalog.length, allThemePack.length);
  assert.deepEqual(
    catalog.map((entry) => entry.layoutKey),
    allThemePack.map((manifest) => manifest.layoutKey),
  );
  assert.ok(catalog.every((entry) => !entry.canPersist));
});

test("marks every coded theme ready after canonical metadata synchronization", () => {
  const databaseThemes = allThemePack.map((manifest) => ({
    id: crypto.randomUUID(),
    layout_key: manifest.layoutKey,
    default_config: defaultThemeConfig,
    preview_image_url: null,
    is_active: true,
  }));
  const catalog = buildThemeStoreCatalog({
    databaseThemes,
    savedThemeConfig: {},
    savedThemeId: null,
  });

  assert.equal(catalog.length, 35);
  assert.equal(catalog.filter((entry) => entry.canPersist).length, 35);
});

test("only marks a unique matching database theme as persistable", () => {
  const metadata = {
    id: crypto.randomUUID(),
    layout_key: "pavni-professional-editorial",
    default_config: defaultThemeConfig,
    preview_image_url: "javascript:alert(1)",
    is_active: true,
  };
  const catalog = buildThemeStoreCatalog({
    databaseThemes: [metadata],
    savedThemeConfig: {},
    savedThemeId: null,
  });
  const editorial = catalog.find(
    (entry) => entry.layoutKey === metadata.layout_key,
  );

  assert.ok(editorial);
  assert.equal(editorial.canPersist, true);
  assert.equal(editorial.databaseThemeId, metadata.id);
  assert.equal(editorial.previewImage, null);

  const duplicateCatalog = buildThemeStoreCatalog({
    databaseThemes: [
      metadata,
      { ...metadata, id: crypto.randomUUID() },
    ],
    savedThemeConfig: {},
    savedThemeId: null,
  });

  assert.equal(
    duplicateCatalog.find((entry) => entry.layoutKey === metadata.layout_key)
      ?.canPersist,
    false,
  );

  const inactiveCatalog = buildThemeStoreCatalog({
    databaseThemes: [{ ...metadata, is_active: false }],
    savedThemeConfig: {},
    savedThemeId: null,
  });
  assert.equal(
    inactiveCatalog.find((entry) => entry.layoutKey === metadata.layout_key)
      ?.canPersist,
    false,
  );
});

test("combines partial database defaults with the canonical ThemeConfig", () => {
  const config = resolveThemeConfig({
    appearance: { accentColor: "#be123c" },
    styleOverrides: { backgroundColor: "#101828" },
    visibility: { showPhone: false },
  });

  assert.equal(config.appearance.accentColor, "#be123c");
  assert.equal(
    config.appearance.backgroundColor,
    defaultThemeConfig.appearance.backgroundColor,
  );
  assert.equal(config.visibility.showPhone, false);
  assert.equal(config.visibility.showEmail, true);
  assert.equal(config.styleOverrides?.backgroundColor, "#101828");
  assert.deepEqual(config.sections.order, defaultThemeConfig.sections.order);
});

test("invalid requested theme keys resolve only to safe registry entries", () => {
  assert.equal(
    resolveThemeLayoutKey(
      "../../arbitrary-module",
      "pavni-dynamic-bento",
    ),
    "pavni-dynamic-bento",
  );
  assert.equal(
    resolveThemeLayoutKey("not-registered", null),
    allThemePack[0]?.layoutKey,
  );
});

test("private theme loaders and mutations retain explicit ownership guards", () => {
  const querySource = readFileSync(
    fileURLToPath(new URL("./store-queries.ts", import.meta.url)),
    "utf8",
  );
  const actionSource = readFileSync(
    fileURLToPath(
      new URL("../../app/themes/actions.ts", import.meta.url),
    ),
    "utf8",
  );

  assert.match(querySource, /\.eq\("user_id", userId\)/);
  assert.match(actionSource, /requireActiveUser\(\)/);
  assert.ok(
    actionSource.match(/\.eq\("user_id", user\.userId\)/g)?.length === 2,
    "both the ownership read and write must constrain user_id",
  );
  assert.doesNotMatch(
    `${querySource}\n${actionSource}`,
    /SUPABASE_SECRET_KEY|createPrivilegedClient/,
  );
});
