import type { ImgHTMLAttributes } from 'react';
import { type ImagePreset, responsiveImage } from '@lib/images';

export interface PictureProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'srcSet' | 'sizes'
> {
  /** The original image URL, as Magento returns it. */
  src: string;
  /** The slot the image fills; one of `IMAGE_PRESETS`. */
  preset: ImagePreset;
  alt: string;
}

/**
 * A `<picture>` serving `src` in modern formats at the preset's widths. Every
 * other attribute — `loading`, `fetchPriority`, `className` — lands on the
 * `<img>`, which is the element the browser prioritises and lays out.
 *
 * The `<picture>` itself is `display: contents`, so the `<img>` sizes against
 * its parent exactly as it would without the wrapper.
 */
export function Picture({ src, preset, alt, ...imgProps }: PictureProps) {
  const image = responsiveImage(src, preset);

  return (
    <picture className="contents">
      {image.sources.map((source) => (
        <source key={source.type} type={source.type} srcSet={source.srcSet} sizes={image.sizes} />
      ))}
      <img src={image.src} alt={alt} {...imgProps} />
    </picture>
  );
}
