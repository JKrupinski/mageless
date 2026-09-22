import { classNames, discountPercent, formatMoney, type MoneyLike } from '@lib/format';

export interface PriceProps {
  final: MoneyLike | null | undefined;
  regular?: MoneyLike | null | undefined;
  percentOff?: number | null;
  /** Magento returns a range for configurables; show "from" when they differ. */
  maximum?: MoneyLike | null | undefined;
  locale?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-display-sm',
} as const;

export function Price({
  final,
  regular,
  percentOff,
  maximum,
  locale = 'en-US',
  size = 'md',
  className,
}: PriceProps) {
  const discount = discountPercent(percentOff);
  const isRange =
    typeof maximum?.value === 'number' &&
    typeof final?.value === 'number' &&
    maximum.value > final.value;

  return (
    // `.numeric` turns on tabular figures: without it a price grid ragged-edges
    // itself as digits change width, and a live cart total visibly twitches.
    <p
      className={classNames(
        'numeric flex flex-wrap items-baseline gap-x-2 gap-y-0.5',
        SIZES[size],
        className,
      )}
    >
      {isRange && <span className="text-xs font-normal text-ink-muted">From</span>}
      <span
        className={classNames(
          'font-semibold tracking-[-0.01em]',
          // A reduced price is the only price that takes the sale colour; a
          // full-price item stays ink so the grid does not read as all-sale.
          discount && regular ? 'text-sale' : 'text-ink',
        )}
      >
        {formatMoney(final, locale)}
      </span>
      {discount && regular ? (
        <>
          <span className="text-[0.8em] text-ink-muted line-through decoration-from-font">
            <span className="sr-only">Regular price </span>
            {formatMoney(regular, locale)}
          </span>
          {/* The percentage is text, not colour alone — a shopper who cannot
              distinguish the sale hue still sees the saving (WCAG 1.4.1). */}
          <span className="text-[0.75em] font-semibold text-sale">−{discount}%</span>
        </>
      ) : null}
    </p>
  );
}
