import { useId } from 'react';
import { classNames } from '@lib/format';

export interface RatingProps {
  /** Magento's `rating_summary`, a 0–100 percentage. */
  percent: number | null | undefined;
  reviewCount?: number | null;
  size?: 'sm' | 'md';
  className?: string;
}

const CELL = 21; // 20 for the star, 1 of gutter
const WIDTH = CELL * 4 + 20; // 104: four steps plus the last star
const HEIGHT = 18.2;

/**
 * One star, its points spanning 16 units from `x + 2`, drawn entirely in
 * relative commands after the opening move.
 *
 * The offset is baked into the path rather than applied with `transform`, and
 * that is load-bearing: `gradientUnits="userSpaceOnUse"` resolves against the
 * user space of the element *referencing* the gradient, transforms included.
 * With a `translate()` on each star the gradient travelled along with it and
 * every star filled to the same fraction — a 3.0 rating rendered as five
 * identical partial stars.
 */
const starAt = (x: number) =>
  `M${10 + x} 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5-4.94-2.59-4.94 2.6.94-5.5-4-3.9 5.53-.8z`;

/** All five as a single path, so each layer is one element in one space. */
const ROW = [0, CELL, CELL * 2, CELL * 3, CELL * 4].map(starAt).join('');

/**
 * Where the fill stops, in user units.
 *
 * A gradient stop, not a clipped overlay: once the stars have gaps between
 * them a percentage width no longer maps to a fraction of a star — 70% of the
 * row's width lands in a gutter, not four-fifths of the way through the
 * fourth star. This walks whole cells and then the partial star's own 16-unit
 * span, so 3.65 stars fills exactly 65% of the fourth one.
 */
function fillBoundary(stars: number) {
  const whole = Math.floor(stars);
  const fraction = stars - whole;
  if (whole >= 5) return WIDTH;
  return whole * CELL + (fraction > 0 ? 2 + fraction * 16 : 0);
}

/**
 * SVG rather than the ★ character: the glyph's width and baseline differ per
 * platform font, which made the filled and empty layers drift apart.
 */
export function Rating({ percent, reviewCount, size = 'sm', className }: RatingProps) {
  // Hooks run before the early return — a conditional hook would break the
  // order React relies on.
  const gradientId = useId();

  if (typeof percent !== 'number' || percent <= 0) return null;

  const stars = (Math.min(100, Math.max(0, percent)) / 100) * 5;
  const label = `Rated ${stars.toFixed(1)} out of 5${
    reviewCount ? ` from ${reviewCount} reviews` : ''
  }`;
  const stop = fillBoundary(stars) / WIDTH;

  return (
    <span className={classNames('inline-flex items-center gap-1.5', className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={label}
        // Height drives the size; width follows the viewBox aspect ratio.
        className={classNames('w-auto text-rating', size === 'sm' ? 'h-3.5' : 'h-4')}
      >
        <defs>
          {/* Two stops at one offset make a hard edge rather than a blur, so a
              half star reads as a half star. */}
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" x2={WIDTH}>
            <stop offset={stop} stopColor="currentColor" />
            <stop offset={stop} stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={ROW} fill="var(--line-strong)" opacity="0.4" />
        <path d={ROW} fill={`url(#${gradientId})`} />
      </svg>

      {reviewCount ? <span className="numeric text-xs text-ink-muted">({reviewCount})</span> : null}
    </span>
  );
}
