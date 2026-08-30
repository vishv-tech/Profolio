import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createProfilePhotoStoragePath,
  createResumeCandidatePrefix,
  getPortfolioAssetUrlOwnership,
  isOwnedResumeCandidatePath,
  MAX_PROFILE_PHOTO_BYTES,
  parseResumeCandidateName,
  validateProfileImageUpload,
} from "@/lib/profile-media/validation";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x04, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

test("accepts genuine JPEG, PNG, and WebP signatures", async () => {
  for (const [bytes, type, extension] of [
    [JPEG, "image/jpeg", "jpg"],
    [PNG, "image/png", "png"],
    [WEBP, "image/webp", "webp"],
  ] as const) {
    const result = await validateProfileImageUpload(
      new File([bytes], `ignored-${extension}`, { type }),
    );

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.contentType, type);
      assert.equal(result.data.extension, extension);
    }
  }
});

test("rejects empty, oversized, unsupported, and MIME-spoofed images", async () => {
  const cases = [
    new File([], "empty.png", { type: "image/png" }),
    new File([new Uint8Array(MAX_PROFILE_PHOTO_BYTES + 1)], "large.png", {
      type: "image/png",
    }),
    new File([PNG], "graphic.gif", { type: "image/gif" }),
    new File([PNG], "spoofed.jpg", { type: "image/jpeg" }),
  ];

  for (const file of cases) {
    assert.equal((await validateProfileImageUpload(file)).success, false);
  }
});

test("builds cache-busting user-owned storage paths without filenames", () => {
  const path = createProfilePhotoStoragePath(
    "11111111-1111-4111-8111-111111111111",
    { id: "22222222-2222-4222-8222-222222222222", kind: "portfolio" },
    "png",
    () => "33333333-3333-4333-8333-333333333333",
  );

  assert.equal(
    path,
    "11111111-1111-4111-8111-111111111111/portfolio/22222222-2222-4222-8222-222222222222/profile/33333333-3333-4333-8333-333333333333.png",
  );
  assert.doesNotMatch(path, /avatar|resume\.pdf|headshot/u);
});

test("recognizes only the current user's public portfolio assets", () => {
  const origin = "https://example.supabase.co";
  const userId = "11111111-1111-4111-8111-111111111111";
  const ownUrl = `${origin}/storage/v1/object/public/portfolio-assets/${userId}/portfolio/id/profile/photo.png`;
  const foreignUrl = `${origin}/storage/v1/object/public/portfolio-assets/other-user/portfolio/id/profile/photo.png`;

  assert.equal(getPortfolioAssetUrlOwnership(ownUrl, origin, userId), "owned");
  assert.equal(
    getPortfolioAssetUrlOwnership(foreignUrl, origin, userId),
    "foreign",
  );
  assert.equal(
    getPortfolioAssetUrlOwnership("https://images.example.com/photo.png", origin, userId),
    "external",
  );
});

test("resume candidate paths are parsed and remain owner scoped", () => {
  const userId = "11111111-1111-4111-8111-111111111111";
  const resumeId = "22222222-2222-4222-8222-222222222222";
  const name = "p1-w240-h300-s11-33333333-3333-4333-8333-333333333333.png";
  const path = `${createResumeCandidatePrefix(userId, resumeId)}/${name}`;

  assert.deepEqual(parseResumeCandidateName(name), {
    height: 300,
    pageNumber: 1,
    score: 11,
    width: 240,
  });
  assert.equal(isOwnedResumeCandidatePath(path, userId, resumeId), true);
  assert.equal(isOwnedResumeCandidatePath(path, "another-user", resumeId), false);
  assert.equal(isOwnedResumeCandidatePath(`${path}/nested.png`, userId, resumeId), false);
});

test("photo actions enforce active auth, ownership, and published-image safety", () => {
  const actions = readFileSync("src/lib/profile-media/actions.ts", "utf8");
  const editor = readFileSync(
    "src/components/portfolio/profile-photo-editor.tsx",
    "utf8",
  );

  assert.match(actions, /requireActiveUser\(\)/u);
  assert.match(actions, /\.eq\("user_id", userId\)/u);
  assert.match(actions, /validateProfileImageUpload/u);
  assert.match(actions, /isOwnedResumeCandidatePath/u);
  assert.match(actions, /candidates\.find\(\(\{ path \}\) => path === candidatePath\)/u);
  assert.match(actions, /upsert: false/u);
  assert.doesNotMatch(actions, /createAdminClient|SUPABASE_SECRET_KEY/u);
  assert.doesNotMatch(actions, /published_content\s*:/u);
  assert.match(actions, /published snapshot may still reference it/u);
  assert.match(editor, /accept="image\/jpeg,image\/png,image\/webp"/u);
  assert.match(editor, /onChange\(result\.url\)/u);
  assert.match(editor, /onChange\(""\)/u);
  assert.doesNotMatch(editor, /capture=/u);
});

test("the shared editor supports resume candidates and both saved/manual photo scopes", () => {
  const editor = readFileSync(
    "src/components/portfolio/profile-photo-editor.tsx",
    "utf8",
  );
  const review = readFileSync(
    "src/components/resume/resume-review-editor.tsx",
    "utf8",
  );
  const workflow = readFileSync(
    "src/components/upload/resume-workflow.tsx",
    "utf8",
  );
  const draft = readFileSync(
    "src/components/portfolio/portfolio-draft-editor.tsx",
    "utf8",
  );

  assert.match(editor, /Images found in this resume/u);
  assert.match(editor, /Use as profile photo/u);
  assert.match(editor, /selectExtractedProfilePhoto/u);
  assert.match(review, /profilePhotoCandidates/u);
  assert.match(workflow, /kind: "resume"/u);
  assert.match(draft, /kind: "portfolio"/u);
  assert.doesNotMatch(review, /Profile image URL/u);
});
