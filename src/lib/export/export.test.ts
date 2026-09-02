import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  createPortfolioExport,
  portfolioExportFilename,
  serializePortfolioExport,
} from "@/lib/export/core";
import type { PortfolioData } from "@/types/portfolio";
import type { ThemeConfig } from "@/types/theme";

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

const portfolioData: PortfolioData = {
  personal: {
    fullName: "Yash Chougule",
    headline: "Developer",
    email: "yash@example.com",
    phone: "",
    location: "Pune",
    profileImageUrl: "https://example.com/yash.jpg",
  },
  summary: "Builds useful products.",
  experience: [],
  education: [],
  projects: [],
  skills: [],
  achievements: [],
  certifications: [],
  links: [],
  languages: [],
  interests: [],
  customSections: [],
};

const themeConfig: ThemeConfig = {
  appearance: {
    colorMode: "light",
    backgroundColor: "#ffffff",
    surfaceColor: "#ffffff",
    textColor: "#111111",
    mutedTextColor: "#666666",
    accentColor: "#2563eb",
    borderColor: "#dddddd",
    fontFamily: "Geist",
    headingFontFamily: "Geist",
    borderRadius: 8,
    spacing: "comfortable",
    animationIntensity: "subtle",
  },
  sections: {
    order: ["summary", "experience", "education", "projects", "skills"],
    hidden: [],
  },
  visibility: {
    showProfileImage: true,
    showEmail: true,
    showPhone: false,
    showLocation: true,
    showLinks: true,
  },
};

const portfolio = {
  title: "Yash's Portfolio",
  slug: "yash-chougule",
  status: "published" as const,
  themeName: "Modern Professional",
  layoutKey: "pavni-modern-professional",
  data: portfolioData,
  themeConfig,
};

test("owner export routes require an active user and an ownership-scoped load", () => {
  const jsonRoute = source("../../app/api/export/[portfolioId]/route.ts");
  const printPage = source(
    "../../app/export/[portfolioId]/print/page.tsx",
  );
  const queries = source("./queries.ts");

  assert.match(jsonRoute, /requireActiveUser\(\)/);
  assert.match(printPage, /requireActiveUser\(\)/);
  assert.match(queries, /PortfolioIdSchema\.safeParse\(portfolioId\)/);
  assert.match(queries, /\.eq\("id", parsedId\.data\)[\s\S]*\.eq\("user_id", userId\)/);
});

test("non-owner, missing, and malformed portfolios share unavailable behavior", () => {
  const queries = source("./queries.ts");
  const route = source("../../app/api/export/[portfolioId]/route.ts");

  assert.match(queries, /if \(!parsedId\.success\) return \{ status: "unavailable" \}/);
  assert.match(queries, /portfolioResult\.error \|\| !portfolioResult\.data/);
  assert.match(route, /status !== "ready"[\s\S]*status: 404/);
});

test("canonical PortfolioData and ThemeConfig validation gates export", () => {
  assert.equal(createPortfolioExport({ ...portfolio, data: {} }), null);
  assert.equal(createPortfolioExport({ ...portfolio, themeConfig: {} }), null);
});

test("JSON export contains portable real data and selected theme configuration", () => {
  const result = createPortfolioExport(
    portfolio,
    new Date("2026-08-30T12:00:00.000Z"),
  );

  assert.equal(result?.exportVersion, 1);
  assert.equal(result?.exportedAt, "2026-08-30T12:00:00.000Z");
  assert.deepEqual(result?.portfolio, {
    title: "Yash's Portfolio",
    slug: "yash-chougule",
    status: "published",
    theme: {
      name: "Modern Professional",
      layoutKey: "pavni-modern-professional",
    },
  });
  assert.deepEqual(result?.portfolioData, portfolioData);
  assert.deepEqual(result?.themeConfig, themeConfig);
});

test("JSON serialization excludes database and authentication internals", () => {
  const json = serializePortfolioExport(
    portfolio,
    new Date("2026-08-30T12:00:00.000Z"),
  );

  assert.ok(json);
  assert.doesNotMatch(
    json,
    /SUPABASE_SECRET_KEY|service_role|access_token|refresh_token|user_id|theme_id|portfolio_id/i,
  );
});

test("download filenames are deterministic, safe, and bounded", () => {
  assert.equal(
    portfolioExportFilename("  Yash's Résumé / Portfolio  "),
    "yash-s-resume-portfolio-portfolio.json",
  );
  assert.equal(portfolioExportFilename("你好"), "portfolio-portfolio.json");
  assert.ok(portfolioExportFilename("x".repeat(200)).length <= 95);
});

test("print export renders the saved PortfolioData through the selected theme", () => {
  const printPage = source(
    "../../app/export/[portfolioId]/print/page.tsx",
  );

  assert.match(printPage, /loadThemeComponent\(result\.portfolio\.layoutKey\)/);
  assert.match(printPage, /data=\{result\.portfolio\.data\}/);
  assert.match(printPage, /config=\{result\.portfolio\.themeConfig\}/);
});

test("print styling preserves theme backgrounds and hides only export controls", () => {
  const printStyles = source(
    "../../app/export/[portfolioId]/print/print.module.css",
  );
  const printMedia = printStyles.slice(printStyles.indexOf("@media print"));

  assert.match(printMedia, /-webkit-print-color-adjust:\s*exact/);
  assert.match(printMedia, /print-color-adjust:\s*exact/);
  assert.match(printMedia, /\.controls\s*\{[\s\S]*?display:\s*none !important/);
  assert.doesNotMatch(
    printMedia,
    /\.canvas\s*\{[^}]*background:\s*(?:white|#fff(?:fff)?)/,
  );
  assert.doesNotMatch(
    printMedia,
    /\.canvas\s+(?:nav|\[role="navigation"\])[^}]*display:\s*none/,
  );
});

test("production export never imports development portfolio fixtures", () => {
  const production = [
    source("./core.ts"),
    source("./queries.ts"),
    source("../../app/dashboard/export/page.tsx"),
    source("../../app/export/[portfolioId]/print/page.tsx"),
    source("../../app/api/export/[portfolioId]/route.ts"),
  ].join("\n");

  assert.doesNotMatch(production, /dev\/fixtures|Avery Morgan|mock portfolio/i);
});
