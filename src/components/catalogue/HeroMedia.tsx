"use client";

import { useReducedMotion } from "framer-motion";
import Photo from "./Photo";
import { imageFor, type MediaAsset } from "@/lib/catalogue/images";

/**
 * The hero frame: a short muted loop when the manifest lists one, otherwise the
 * photograph. A manifest video is optional — with none, this is just the photo,
 * so there is never a broken or empty frame.
 *
 * `prefers-reduced-motion: reduce` gets the poster photograph and no download of
 * the video at all, which is also the cheaper path on a slow connection.
 */
export default function HeroMedia({
  video,
  fallbackKey,
  alt,
  sizes,
}: {
  /** Manifest video entry with `category: "hero"`, or null. */
  video: MediaAsset | null;
  /** Manifest key (or direct URL) for the still image. */
  fallbackKey: string;
  alt: string;
  sizes: string;
}) {
  const reduceMotion = useReducedMotion();
  const still = imageFor(fallbackKey);

  if (!video || reduceMotion) {
    return <Photo image={still} alt={alt} sizes={sizes} lcp />;
  }

  const poster = video.poster ? imageFor(video.poster) : still;
  const type = video.src.endsWith(".webm") ? "video/webm" : "video/mp4";

  return (
    <video
      className="photo-warm h-full w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster.src}
      aria-label={alt}
      width={video.width}
      height={video.height}
    >
      <source src={video.src} type={type} />
    </video>
  );
}
