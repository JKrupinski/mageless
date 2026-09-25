import type { FragmentOf } from 'gql.tada';
import type { ProductCardFragment } from '@lib/graphql/fragments';
import { Badge } from '@ui/Badge';
import { Picture } from '@ui/Picture';
import { Price } from '@ui/Price';
import { Rating } from '@ui/Rating';
import { classNames, productUrl } from '@lib/format';
import { IMAGE_PRESETS } from '@lib/images';

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

/**
 * Deliberately borderless and shadowless. A grid of framed cards puts a box
 * around every photograph and makes forty products read as forty containers;
 * letting the image sit on a tinted pad keeps the merchandise as the only
 * thing with edges. Separation comes from the grid gap instead.
 */
export function ProductCard({
  product,
  locale = 'en-US',
  priority = false,
  className,
}: ProductCardProps) {
  const price = product.price_range.minimum_price;
  const outOfStock = product.stock_status === 'OUT_OF_STOCK';
  const href = productUrl(product);
  const percentOff = price.discount?.percent_off;

  return (
    <article className={classNames('group relative flex h-full flex-col', className)}>
      <div className="relative overflow-hidden rounded-card bg-surface-sunken">
        <div className="aspect-4/5">
          {product.small_image?.url ? (
            <Picture
              src={product.small_image.url}
              preset={IMAGE_PRESETS.tile}
              alt={product.small_image.label ?? product.name ?? ''}
              width={360}
              height={450}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding={priority ? 'sync' : 'async'}
              className={classNames(
                'size-full object-cover',
                'transition-transform duration-500 ease-out-soft group-hover:scale-[1.04]',
                'motion-reduce:transition-none motion-reduce:group-hover:scale-100',
                outOfStock && 'opacity-55',
              )}
            />
          ) : (
            <div
              className="flex size-full items-center justify-center text-xs text-ink-muted"
              aria-hidden="true"
            >
              No image
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute top-2 left-2 flex flex-col items-start gap-1">
          {percentOff ? <Badge tone="sale">−{Math.round(percentOff)}%</Badge> : null}
          {outOfStock ? <Badge tone="neutral">Sold out</Badge> : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 pt-3">
        <h3 className="text-sm leading-snug font-medium text-ink">
          {/* The stretched pseudo-element makes the whole card clickable while
              keeping a single, correctly-labelled link for screen readers. */}
          <a
            href={href}
            className="line-clamp-2 decoration-1 underline-offset-2 after:absolute after:inset-0 after:content-[''] group-hover:underline"
          >
            {product.name}
          </a>
        </h3>

        {product.rating_summary ? (
          <Rating percent={product.rating_summary} reviewCount={product.review_count} />
        ) : null}

        <Price
          className="mt-auto pt-0.5"
          final={price.final_price}
          regular={price.regular_price}
          percentOff={percentOff}
          maximum={product.price_range.maximum_price?.final_price}
          locale={locale}
        />
      </div>
    </article>
  );
}
