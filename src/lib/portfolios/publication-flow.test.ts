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

test("theme selection and publication retain active-user ownership checks", () => {
  const selection = source("../../app/themes/actions.ts");
  const publication = source("./actions.ts");

  for (const action of [selection, publication]) {
    assert.match(action, /requireActiveUser\(\)/);
    assert.match(action, /\.eq\("user_id", user\.userId\)/);
    assert.match(action, /isUniqueActiveCodedTheme/);
  }
});

test("publication snapshots content, theme, config, and version history atomically", () => {
  const migration = source(
    "../../../supabase/migrations/20260828153345_portfolio_publication_infrastructure.sql",
  );

  assert.match(migration, /insert into public\.deployments/);
  assert.match(migration, /v_portfolio\.draft_content/);
  assert.match(migration, /v_portfolio\.theme_id/);
  assert.match(migration, /v_portfolio\.theme_config/);
  assert.match(migration, /set status = 'historical'/);
  assert.match(migration, /status = 'published'/);
});

test("the public route resolves only the published snapshot through a safe registry lookup", () => {
  const query = source("./queries.ts");
  const page = source("../../app/p/[slug]/page.tsx");

  assert.match(query, /PortfolioSlugSchema\.safeParse/);
  assert.match(query, /\.rpc\("get_published_portfolio"/);
  assert.match(query, /published_content: PortfolioDataSchema/);
  assert.match(page, /loadThemeComponent\(portfolio\.theme\.layoutKey\)/);
  assert.match(page, /portfolio\.publishedContent/);
  assert.doesNotMatch(`${query}\n${page}`, /draft_content|Avery Morgan/);
});
