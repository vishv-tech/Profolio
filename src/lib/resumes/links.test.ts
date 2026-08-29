import assert from "node:assert/strict";
import test from "node:test";

import {
  extractLinksFromPdfAnnotations,
  extractVisibleResumeLinks,
  mergeResumeLinks,
} from "@/lib/resumes/links";

test("classifies supported external PDF annotation links", () => {
  const links = extractLinksFromPdfAnnotations([
    { url: "https://www.linkedin.com/in/example" },
    { url: "https://github.com/example" },
    { url: "https://www.youtube.com/@example" },
    { url: "https://youtu.be/example-video" },
    { url: "https://www.behance.net/example" },
    { url: "https://dribbble.com/example" },
    { url: "https://medium.com/@example" },
  ]);

  assert.deepEqual(
    links.map(({ label, type }) => ({ label, type })),
    [
      { label: "LinkedIn", type: "linkedin" },
      { label: "GitHub", type: "github" },
      { label: "YouTube", type: "youtube" },
      { label: "YouTube", type: "youtube" },
      { label: "Behance", type: "behance" },
      { label: "Dribbble", type: "dribbble" },
      { label: "Medium", type: "medium" },
    ],
  );
});

test("uses an annotation's visible Portfolio label for a personal site", () => {
  const links = extractLinksFromPdfAnnotations(
    [{ rect: [10, 10, 100, 30], url: "https://vedant.dev" }],
    [
      {
        height: 12,
        str: "Portfolio",
        transform: [1, 0, 0, 1, 12, 16],
        width: 50,
      },
    ],
  );

  assert.deepEqual(links, [
    {
      label: "Portfolio",
      type: "portfolio",
      url: "https://vedant.dev/",
    },
  ]);
});

test("rejects empty, local, credentialed, and unsafe annotation URLs", () => {
  const links = extractLinksFromPdfAnnotations([
    {},
    { url: "" },
    { url: "javascript://example.com/alert" },
    { url: "data://example.com/private" },
    { url: "file:///private/resume.pdf" },
    { url: "http://localhost/resume" },
    { url: "http://10.0.0.1/resume" },
    { url: "http://100.64.0.1/resume" },
    { url: "http://team.internal/resume" },
    { url: "http://[0:0:0:0:0:0:0:1]/resume" },
    { url: "http://[::ffff:127.0.0.1]/resume" },
    { url: "https://user:password@example.com/private" },
  ]);

  assert.deepEqual(links, []);
});

test("deduplicates duplicate annotations and identical visible URLs", () => {
  const annotationLinks = extractLinksFromPdfAnnotations([
    { url: "https://linkedin.com/in/example" },
    { url: "https://linkedin.com/in/example/" },
    { url: "https://github.com/example" },
  ]);
  const visibleLinks = extractVisibleResumeLinks(
    "LinkedIn: https://linkedin.com/in/example and www.github.com/example",
  );
  let id = 0;
  const merged = mergeResumeLinks(
    annotationLinks,
    visibleLinks,
    () => `link-${(id += 1)}`,
  );

  assert.deepEqual(
    merged.map(({ id: linkId, label, type, url }) => ({
      id: linkId,
      label,
      type,
      url,
    })),
    [
      {
        id: "link-1",
        label: "LinkedIn",
        type: "linkedin",
        url: "https://linkedin.com/in/example",
      },
      {
        id: "link-2",
        label: "GitHub",
        type: "github",
        url: "https://github.com/example",
      },
    ],
  );
});

test("keeps deterministic links when Gemini omits them and filters unsafe Gemini links", () => {
  const deterministic = extractLinksFromPdfAnnotations([
    { url: "https://linkedin.com/in/example" },
    { url: "https://github.com/example" },
  ]);
  let id = 0;
  const merged = mergeResumeLinks(
    deterministic,
    [
      {
        label: "LinkedIn profile",
        type: "linkedin",
        url: "https://linkedin.com/in/example/",
      },
      {
        label: "Unsafe",
        type: "other",
        url: "javascript://example.com/alert",
      },
    ],
    () => `link-${(id += 1)}`,
  );

  assert.deepEqual(
    merged.map(({ type }) => type),
    ["linkedin", "github"],
  );
});
