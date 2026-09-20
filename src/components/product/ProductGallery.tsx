import { useState } from 'react';
import { classNames } from '@lib/format';

export interface GalleryImage {
  url: string;
  label: string | null;
}

export interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  if (!current) {
    return <div className="aspect-square w-full rounded-[--radius-card] bg-surface-inset" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-[--radius-card] bg-surface-muted">
        <img
          src={current.url}
          alt={current.label ?? productName}
          width={800}
          height={1000}
          /* The main image is the product page's LCP element. */
          fetchPriority="high"
          decoding="sync"
          className="aspect-[4/5] w-full object-cover"
        />
      </div>

      {images.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={index === active}
                className={classNames(
                  'overflow-hidden rounded-[--radius-control] border-2 transition-colors',
                  index === active
                    ? 'border-brand-600'
                    : 'border-transparent hover:border-border-subtle',
                )}
              >
                <img
                  src={image.url}
                  alt=""
                  width={72}
                  height={90}
                  loading="lazy"
                  decoding="async"
                  className="size-18 aspect-[4/5] w-18 object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
