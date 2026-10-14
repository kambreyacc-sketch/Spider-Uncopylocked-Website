"use client";

import { useEffect, useState } from "react";

const HERO_VIDEO = "https://freeflowstore.com/uploads/videos/admin/4ef59c64-b640-4a38-b42d-301b515ecfe5.mp4";

export default function HeroBackgroundVideo() {
  const [reducedMotion, setReducedMotion] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return (
    <>
      {!reducedMotion && !unavailable && (
        <video
          className="spider-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          onError={() => setUnavailable(true)}
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
      )}
      <div className="spider-hero-media-fallback" aria-hidden="true" />
    </>
  );
}
