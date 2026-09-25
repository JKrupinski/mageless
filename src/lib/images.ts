/**
 * Responsive catalogue images.
 *
 * Magento hands out one pre-sized cache file per product image. Rather than
 * shipping that file to every screen, each image is re-served through Astro's
 * image endpoint (`/_image`, backed by sharp) at a handful of widths and in
 * AVIF and WebP, and the browser picks the smallest variant that fills its
 * slot. The endpoint only fetches hosts allowed by `image.domains` in
 * `astro.config.mjs`.
 *
 * The URLs are built here rather than with `getImage()` from `astro:assets`
 * because the gallery is a React island: it has to swap images in the browser,
 * where `astro:assets` is not available. A store that puts a CDN's image
 * service in front instead only has to change `transformUrl`.
 */

const IMAGE_ENDPOINT = '/_image';

type ImageFormat = 'avif' | 'webp' | 'jpeg';

/** Offered as `<source>` elements, best compression first. */
const MODERN_FORMATS = ['avif', 'webp'] as const satisfies readonly ImageFormat[];

export interface ImagePreset {
  /** Rendered widths, in pixels, the browser may choose between. Ascending. */
  widths: readonly [number, ...number[]];
  /** The `sizes` attribute: how wide the image slot is at each breakpoint. */
  sizes: string;
}

export interface ImageSource {
  type: `image/${ImageFormat}`;
  srcSet: string;
}

export interface ResponsiveImage {
  /**
   * JPEG at the widest preset width, for a browser that supports neither
   * modern format. Every browser in use today takes a `<source>` instead, so
   * this is a single fallback rather than a JPEG srcset repeated in the HTML
   * of every tile.
   */
  src: string;
  sizes: string;
  /** Modern-format candidates, to render as `<source>` elements in order. */
  sources: ImageSource[];
}

/**
 * The image slots the catalogue renders. `sizes` mirrors the layout each slot
 * sits in, so it has to move with it: an estimate that is too small serves a
 * blurry image, one that is too large wastes bytes.
 */
export const IMAGE_PRESETS = {
  /**
   * A product tile in a `ProductGrid`: two columns on a phone, three from `sm`.
   * From `lg` it is either four columns, or three beside the category page's
   * 15rem facet sidebar — both land near 22vw, and the 80rem page container
   * caps either at about 19rem.
   */
  tile: {
    widths: [240, 360, 480, 720, 960],
    sizes: '(min-width: 80rem) 19rem, (min-width: 64rem) 23vw, (min-width: 40rem) 33vw, 50vw',
  },
  /** The product page's main image: full width on a phone, capped at 32rem. */
  gallery: {
    widths: [400, 600, 800, 1080],
    sizes: '(min-width: 34rem) 32rem, 100vw',
  },
  /** A gallery thumbnail button. */
  thumbnail: {
    widths: [64, 128, 192],
    sizes: '4rem',
  },
} as const satisfies Record<string, ImagePreset>;

function transformUrl(src: string, width: number, format: ImageFormat): string {
  const params = new URLSearchParams({ href: src, w: String(width), f: format });
  return `${IMAGE_ENDPOINT}?${params}`;
}

function srcSetFor(src: string, widths: readonly number[], format: ImageFormat): string {
  return widths.map((width) => `${transformUrl(src, width, format)} ${width}w`).join(', ');
}

/** Every variant of one Magento image a `<picture>` needs for the given slot. */
export function responsiveImage(src: string, preset: ImagePreset): ResponsiveImage {
  const widest = Math.max(...preset.widths);

  return {
    src: transformUrl(src, widest, 'jpeg'),
    sizes: preset.sizes,
    sources: MODERN_FORMATS.map((format) => ({
      type: `image/${format}`,
      srcSet: srcSetFor(src, preset.widths, format),
    })),
  };
}
