import { PackageOpen } from 'lucide-react';
import { ProductCard, type ProductCardData } from './ProductCard';
import { classNames } from '@lib/format';

export interface ProductGridProps {
  products: readonly (ProductCardData | null)[];
  locale?: string;
  /** How many leading tiles to mark as LCP candidates. */
  priorityCount?: number;
  className?: string;
  emptyMessage?: string;
  /** Rendered under the empty message — usually a way back to everything. */
  emptyAction?: { label: string; href: string };
  /** Tiles per row at the largest breakpoint. */
  columns?: 3 | 4;
}

const COLUMNS = {
  3: 'grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6',
  4: 'grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4',
} as const;

export function ProductGrid({
  products,
  locale = 'en-US',
  priorityCount = 4,
  className,
  emptyMessage = 'No products matched your selection.',
  emptyAction,
  columns = 4,
}: ProductGridProps) {
  const items = products.filter((product): product is ProductCardData => product !== null);

  // An empty result is a dead end unless it offers a way out, so the empty
  // state carries an action rather than only an apology.
  if (items.length === 0) {
    return (
      <div
        className={classNames(
          'flex flex-col items-center rounded-panel border border-dashed border-line',
          'px-6 py-16 text-center',
          className,
        )}
      >
        <PackageOpen className="size-7 text-ink-subtle" aria-hidden="true" />
        <p className="mt-4 text-sm font-medium text-ink">{emptyMessage}</p>
        <p className="mt-1 text-sm text-ink-muted">
          Try removing a filter or widening your search.
        </p>
        {emptyAction && (
          <a
            href={emptyAction.href}
            className="mt-6 inline-flex h-10 items-center rounded-control border border-line-strong px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-hover"
          >
            {emptyAction.label}
          </a>
        )}
      </div>
    );
  }

  return (
    <ul className={classNames('grid', COLUMNS[columns], className)}>
      {items.map((product, index) => (
        // The tile is the list item itself. An intermediate `display: contents`
        // wrapper drops the list semantics in some screen readers.
        <li key={product.uid} className="flex">
          <ProductCard
            className="w-full"
            product={product}
            locale={locale}
            priority={index < priorityCount}
          />
        </li>
      ))}
    </ul>
  );
}
