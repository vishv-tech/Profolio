"use client";

import { ImagePlus, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  removeProfilePhotoReference,
  selectExtractedProfilePhoto,
  uploadProfilePhoto,
} from "@/lib/profile-media/actions";
import type {
  ProfilePhotoCandidate,
  ProfilePhotoScope,
} from "@/lib/profile-media/types";
import { MAX_PROFILE_PHOTO_BYTES } from "@/lib/profile-media/validation";

import styles from "./profile-photo-editor.module.css";

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function initials(value: string) {
  const result = value
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return result || "PF";
}

export function ProfilePhotoEditor({
  candidates = [],
  fullName,
  onChange,
  scope,
  value,
}: {
  candidates?: ProfilePhotoCandidate[];
  fullName: string;
  onChange: (url: string) => void;
  scope: ProfilePhotoScope;
  value: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startMutation] = useTransition();
  const displayedUrl = localPreview || value;
  const showImage = Boolean(displayedUrl && failedUrl !== displayedUrl);

  useEffect(() => {
    if (!localPreview) return;
    return () => URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  function choosePhoto(file: File | null) {
    if (!file) return;

    if (!SUPPORTED_IMAGE_TYPES.has(file.type.toLowerCase())) {
      setMessage("Use a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size === 0 || file.size > MAX_PROFILE_PHOTO_BYTES) {
      setMessage("Profile photos must be larger than 0 bytes and 5 MB or smaller.");
      return;
    }

    const preview = URL.createObjectURL(file);
    const formData = new FormData();
    formData.set("photo", file);
    setFailedUrl(null);
    setLocalPreview(preview);
    setMessage("Uploading photo…");

    startMutation(async () => {
      try {
        const result = await uploadProfilePhoto(scope, formData);
        if (!result.success) {
          setMessage(result.message);
          setLocalPreview(null);
          return;
        }

        onChange(result.url);
        setMessage("Photo uploaded. Save the draft to keep this change.");
        setLocalPreview(null);
      } catch {
        setMessage("The profile photo could not be uploaded. Please try again.");
        setLocalPreview(null);
      }
    });
  }

  function removePhoto() {
    if (!value || pending) return;

    setMessage(null);
    startMutation(async () => {
      try {
        const result = await removeProfilePhotoReference(scope, value);
        if (!result.success) {
          setMessage(result.message);
          return;
        }

        onChange("");
        setFailedUrl(null);
        setMessage("Photo removed from the draft. Save to keep this change.");
      } catch {
        setMessage("The profile photo could not be removed. Please try again.");
      }
    });
  }

  function selectCandidate(candidate: ProfilePhotoCandidate) {
    if (scope.kind !== "resume" || pending) return;

    setMessage(null);
    startMutation(async () => {
      try {
        const result = await selectExtractedProfilePhoto(scope.id, candidate.path);
        if (!result.success) {
          setMessage(result.message);
          return;
        }

        onChange(result.url);
        setFailedUrl(null);
        setMessage("Resume photo selected. Save the review to keep this change.");
      } catch {
        setMessage("That resume photo could not be selected. Please try again.");
      }
    });
  }

  return (
    <div className={styles.card}>
      <div className={styles.mediaRow}>
        <div className={styles.preview}>
          {showImage ? (
            // This controlled URL is either an existing safe legacy URL or an
            // owned public Supabase Storage object.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={`${fullName.trim() || "Portfolio owner"} profile preview`}
              onError={() => setFailedUrl(displayedUrl)}
              src={displayedUrl}
            />
          ) : (
            <span aria-label="Profile photo fallback">{initials(fullName)}</span>
          )}
        </div>
        <div className={styles.copy}>
          <div>
            <p className={styles.copyTitle}>Profile photo</p>
            <p className={styles.copyText}>
              JPEG, PNG, or WebP up to 5 MB. The photo may appear publicly after
              you publish or republish this portfolio.
            </p>
          </div>
          <div className={styles.actions}>
            <Button
              disabled={pending}
              onClick={() => inputRef.current?.click()}
              type="button"
              variant="outline"
            >
              {pending ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : value ? (
                <RefreshCw aria-hidden="true" />
              ) : (
                <ImagePlus aria-hidden="true" />
              )}
              {value ? "Change Photo" : "Add Photo"}
            </Button>
            {value ? (
              <Button
                disabled={pending}
                onClick={removePhoto}
                type="button"
                variant="ghost"
              >
                <Trash2 aria-hidden="true" />
                Remove Photo
              </Button>
            ) : null}
          </div>
          <input
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => {
              choosePhoto(event.target.files?.item(0) ?? null);
              event.currentTarget.value = "";
            }}
            ref={inputRef}
            type="file"
          />
        </div>
      </div>
      {message ? (
        <p aria-live="polite" className={styles.message}>
          {message}
        </p>
      ) : null}
      {scope.kind === "resume" && candidates.length > 0 ? (
        <div className={styles.candidateArea}>
          <div>
            <p className="text-sm font-medium">Images found in this resume</p>
            <p className={styles.candidateCopy}>
              When no candidate is clearly a portrait, choose one yourself. No
              image is selected automatically from an ambiguous group.
            </p>
          </div>
          <div className={styles.candidateGrid}>
            {candidates.map((candidate) => (
              <div className={styles.candidate} key={candidate.path}>
                {/* Candidate URLs come from the authenticated server listing. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={`Resume image candidate from page ${candidate.pageNumber}`}
                  src={candidate.url}
                />
                <Button
                  className="w-full"
                  disabled={pending}
                  onClick={() => selectCandidate(candidate)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Use as profile photo
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
