import { ProductCard, type ProductCardData } from './ProductCard';
import { classNames } from '@lib/format';

export interface ProductGridProps {
  products: readonly (ProductCardData | null)[];
  locale?: string;
  /** How many leading tiles to mark as LCP candidates. */
  priorityCount?: number;
  className?: string;
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  locale = 'en-US',
  priorityCount = 4,
  className,
  emptyMessage = 'No products matched your selection.',
}: ProductGridProps) {
  const items = products.filter((product): product is ProductCardData => product !== null);

  if (items.length === 0) {
    return (
      <p className="rounded-[--radius-card] border border-dashed border-border-subtle p-8 text-center text-sm text-ink-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className={classNames('grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4', className)}>
      {items.map((product, index) => (
        <li key={product.uid} className="contents">
          <ProductCard product={product} locale={locale} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
