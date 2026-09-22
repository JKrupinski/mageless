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
    return (
      <div className="flex aspect-4/5 w-full items-center justify-center rounded-card bg-surface-sunken text-sm text-ink-muted">
        No image available
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-card bg-surface-sunken">
        <img
          src={current.url}
          alt={current.label ?? productName}
          width={800}
          height={1000}
          /* The main image is the product page's LCP element. */
          fetchPriority="high"
          decoding="sync"
          className="aspect-4/5 w-full object-cover"
        />
      </div>

      {images.length > 1 ? (
        <ul className="hide-scrollbar flex gap-3 overflow-x-auto py-1">
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={index === active}
                className={classNames(
                  'block cursor-pointer overflow-hidden rounded-control bg-surface-sunken',
                  'outline-2 outline-offset-2 transition-[outline-color] duration-150 ease-out-soft',
                  index === active
                    ? 'outline-ink'
                    : 'outline-transparent hover:outline-line-strong',
                )}
              >
                <img
                  src={image.url}
                  alt=""
                  width={72}
                  height={90}
                  loading="lazy"
                  decoding="async"
                  className="aspect-4/5 w-16 object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
