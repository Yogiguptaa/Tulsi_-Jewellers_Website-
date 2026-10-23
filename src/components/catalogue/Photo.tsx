import Image from "next/image";
import type { CatalogueImage } from "@/lib/catalogue/images";

/**
 * components/catalogue/Photo.tsx — one catalogue photograph.
 *
 * Every photo on the storefront goes through this component so that four things
 * are true everywhere, and can be corrected in one place:
 *
 *   1. `next/image` reserves the real aspect ratio (no layout shift, no
 *      stretched file — a hand-written width/height used to squash the showroom
 *      photograph from 1280×851 into 960×1200),
 *   2. `sizes` matches how wide the picture is really drawn, so the browser
 *      downloads a ~350 px file instead of the full 1280 px original,
 *   3. a generated blur placeholder holds the space while it loads, and
 *   4. `.photo-warm` applies the same subtle grade to every photograph, which
 *      is what makes mixed Wikimedia and owner photography look like one set.
 *
 * Layout is left to the caller (`className`), normally `h-full w-full
 * object-cover` inside an `aspect-*` box.
 */
export default function Photo({
  image,
  alt,
  sizes,
  className = "h-full w-full object-cover",
  lcp = false,
}: {
  image: CatalogueImage;
  alt: string;
  /** How wide this picture is drawn, e.g. "(min-width: 1024px) 30vw, 90vw". */
  sizes: string;
  className?: string;
  /**
   * The largest image above the fold on this page — one per page. This version
   * of Next deprecates `priority` in favour of `preload`, which adds a `<link
   * rel="preload">` in the head; it must not be combined with `loading`, so it
   * is applied instead of the lazy default rather than alongside it.
   */
  lcp?: boolean;
}) {
  return (
    <Image
      src={image.src}
      alt={alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      preload={lcp}
      loading={lcp ? undefined : "lazy"}
      placeholder={image.blurDataURL ? "blur" : "empty"}
      blurDataURL={image.blurDataURL}
      className={`photo-warm ${className}`}
    />
  );
}
