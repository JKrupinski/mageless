import type { FragmentOf } from 'gql.tada';
import type { ProductCardFragment } from '@lib/graphql/fragments';
import { Badge } from '@ui/Badge';
import { Price } from '@ui/Price';
import { Rating } from '@ui/Rating';
import { classNames, productUrl } from '@lib/format';

export type ProductCardData = FragmentOf<typeof ProductCardFragment>;

export interface ProductCardProps {
  product: ProductCardData;
  locale?: string;
  /**
   * The first tiles above the fold are the LCP candidate on a category page:
   * they must be eager and high priority, everything below stays lazy.
   */
  priority?: boolean;
  className?: string;
}

export function ProductCard({
  product,
  locale = 'en-US',
  priority = false,
  className,
}: ProductCardProps) {
  const price = product.price_range.minimum_price;
  const outOfStock = product.stock_status === 'OUT_OF_STOCK';
  const href = productUrl(product);

  return (
    <article
      className={classNames(
        'group relative flex h-full flex-col overflow-hidden rounded-[--radius-card]',
        'border border-border-subtle bg-surface transition-shadow duration-200 ease-[--ease-out-soft]',
        'hover:shadow-lg hover:shadow-black/5',
        className,
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-muted">
        {product.small_image?.url ? (
          <img
            src={product.small_image.url}
            alt={product.small_image.label ?? product.name ?? ''}
            width={360}
            height={480}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding={priority ? 'sync' : 'async'}
            className="size-full object-cover transition-transform duration-300 ease-[--ease-out-soft] group-hover:scale-[1.03]"
          />
        ) : (
          <div className="size-full bg-surface-inset" aria-hidden="true" />
        )}

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {price.discount?.percent_off ? (
            <Badge tone="sale">−{Math.round(price.discount.percent_off)}%</Badge>
          ) : null}
          {outOfStock ? <Badge tone="neutral">Out of stock</Badge> : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-sm font-medium text-ink">
          {/* The stretched pseudo-element makes the whole card clickable while
              keeping a single, correctly-labelled link for screen readers. */}
          <a href={href} className="after:absolute after:inset-0 after:content-['']">
            {product.name}
          </a>
        </h3>

        <Rating percent={product.rating_summary} reviewCount={product.review_count} />

        <Price
          className="mt-auto"
          final={price.final_price}
          regular={price.regular_price}
          percentOff={price.discount?.percent_off}
          maximum={product.price_range.maximum_price?.final_price}
          locale={locale}
        />
      </div>
    </article>
  );
}
