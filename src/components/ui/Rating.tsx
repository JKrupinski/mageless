import { classNames } from '@lib/format';

export interface RatingProps {
  /** Magento's `rating_summary`, a 0–100 percentage. */
  percent: number | null | undefined;
  reviewCount?: number | null;
  className?: string;
}

/**
 * Stars are drawn with a clipped overlay rather than per-star rounding, so a
 * 73% rating renders as 3.65 stars instead of snapping to 4.
 */
export function Rating({ percent, reviewCount, className }: RatingProps) {
  if (typeof percent !== 'number' || percent <= 0) return null;
  const stars = (percent / 100) * 5;
  const label = `Rated ${stars.toFixed(1)} out of 5${
    reviewCount ? ` from ${reviewCount} reviews` : ''
  }`;

  return (
    <span className={classNames('inline-flex items-center gap-1.5', className)} title={label}>
      <span className="relative inline-block text-sm leading-none" role="img" aria-label={label}>
        <span aria-hidden="true" className="text-border-subtle">
          ★★★★★
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-0 overflow-hidden text-brand-500"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        >
          ★★★★★
        </span>
      </span>
      {reviewCount ? <span className="text-xs text-ink-muted">({reviewCount})</span> : null}
    </span>
  );
}
