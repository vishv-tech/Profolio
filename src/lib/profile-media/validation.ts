export const PROFILE_PHOTO_BUCKET = "portfolio-assets";
export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;

const RESUME_CANDIDATE_NAME_PATTERN =
  /^p(\d+)-w(\d+)-h(\d+)-s(\d+)-[a-z0-9-]+\.png$/u;

const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type ValidProfileImage = {
  bytes: Uint8Array;
  contentType: keyof typeof IMAGE_TYPES;
  extension: (typeof IMAGE_TYPES)[keyof typeof IMAGE_TYPES];
};

export type ProfileImageValidation =
  | { success: true; data: ValidProfileImage }
  | { success: false; message: string };

function detectedImageType(bytes: Uint8Array): keyof typeof IMAGE_TYPES | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

export async function validateProfileImageUpload(
  value: FormDataEntryValue | null,
): Promise<ProfileImageValidation> {
  if (!(value instanceof File) || value.size === 0) {
    return { success: false, message: "Choose an image to continue." };
  }

  if (value.size > MAX_PROFILE_PHOTO_BYTES) {
    return {
      success: false,
      message: "Profile photos must be 5 MB or smaller.",
    };
  }

  const declaredType = value.type.trim().toLowerCase();
  if (!(declaredType in IMAGE_TYPES)) {
    return {
      success: false,
      message: "Use a JPEG, PNG, or WebP image.",
    };
  }

  const bytes = new Uint8Array(await value.arrayBuffer());
  const detectedType = detectedImageType(bytes);

  if (!detectedType || detectedType !== declaredType) {
    return {
      success: false,
      message: "The selected file is not a valid supported image.",
    };
  }

  return {
    success: true,
    data: {
      bytes,
      contentType: detectedType,
      extension: IMAGE_TYPES[detectedType],
    },
  };
}

export function createProfilePhotoStoragePath(
  userId: string,
  scope: { id: string; kind: "portfolio" | "resume" },
  extension: ValidProfileImage["extension"],
  createId: () => string = () => crypto.randomUUID(),
) {
  return `${userId}/${scope.kind}/${scope.id}/profile/${createId()}.${extension}`;
}

export function createResumeCandidatePrefix(userId: string, resumeId: string) {
  return `${userId}/resume/${resumeId}/candidates`;
}

export function parseResumeCandidateName(name: string) {
  const match = RESUME_CANDIDATE_NAME_PATTERN.exec(name);
  if (!match) return null;

  const pageNumber = Number(match[1]);
  const width = Number(match[2]);
  const height = Number(match[3]);
  const score = Number(match[4]);

  return [pageNumber, width, height, score].every(Number.isSafeInteger)
    ? { height, pageNumber, score, width }
    : null;
}

export function isOwnedResumeCandidatePath(
  path: string,
  userId: string,
  resumeId: string,
) {
  const prefix = `${createResumeCandidatePrefix(userId, resumeId)}/`;
  const name = path.startsWith(prefix) ? path.slice(prefix.length) : "";
  return Boolean(name && !name.includes("/") && parseResumeCandidateName(name));
}

export type PortfolioAssetUrlOwnership = "external" | "foreign" | "owned";

export function getPortfolioAssetUrlOwnership(
  value: string,
  supabaseUrl: string,
  userId: string,
): PortfolioAssetUrlOwnership {
  let candidate: URL;
  let origin: URL;

  try {
    candidate = new URL(value);
    origin = new URL(supabaseUrl);
  } catch {
    return "external";
  }

  const prefix = `/storage/v1/object/public/${PROFILE_PHOTO_BUCKET}/`;
  if (candidate.origin !== origin.origin || !candidate.pathname.startsWith(prefix)) {
    return "external";
  }

  try {
    const objectPath = decodeURIComponent(candidate.pathname.slice(prefix.length));
    return objectPath.startsWith(`${userId}/`) ? "owned" : "foreign";
  } catch {
    return "foreign";
  }
}
