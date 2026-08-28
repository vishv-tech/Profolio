"use client";

import { useState } from "react";
import { Camera, Sparkles } from "lucide-react";

import { getThemeInitials } from "../shared/data";
import { getSafeExternalUrl } from "../shared/links";
import { styles } from "./ContentCreatorTheme.styles";

interface CreatorPortraitProps {
  fullName: string;
  imageUrl: string;
}

export function CreatorPortrait({ fullName, imageUrl }: CreatorPortraitProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const safeImageUrl = getSafeExternalUrl(imageUrl);
  const showImage = Boolean(safeImageUrl && !imageFailed);

  return (
    <div
      className={styles.portraitSlot}
      data-portrait-mode={showImage ? "image" : "fallback"}
    >
      <div className={styles.portraitShell}>
        <div className={styles.portraitToolbar} aria-hidden="true">
          <span />
          <span />
          <span />
          <small>portrait / 01</small>
        </div>
        {showImage ? (
          // The URL is user-configured, so its remote host cannot be known by
          // Next Image at build time. The error state replaces broken media.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`${fullName.trim() || "Portfolio owner"} portrait`}
            className={styles.portraitImage}
            decoding="async"
            fetchPriority="high"
            onError={() => setImageFailed(true)}
            src={safeImageUrl ?? undefined}
          />
        ) : (
          <div
            aria-label={`${fullName.trim() || "Portfolio owner"} typographic portrait`}
            className={styles.portraitFallback}
            role="img"
          >
            <Camera aria-hidden="true" />
            <strong>{getThemeInitials(fullName)}</strong>
            <span>Visual stories, thoughtfully framed.</span>
          </div>
        )}
        <span className={styles.portraitSticker} aria-hidden="true">
          <Sparkles />
        </span>
      </div>
      <p className={styles.portraitCaption}>
        <span>Profile frame</span>
        <span>Creator-led / original</span>
      </p>
    </div>
  );
}
