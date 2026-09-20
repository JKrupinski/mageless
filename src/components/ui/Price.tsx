import { classNames, discountPercent, formatMoney, type MoneyLike } from '@lib/format';

export interface PriceProps {
  final: MoneyLike | null | undefined;
  regular?: MoneyLike | null | undefined;
  percentOff?: number | null;
  /** Magento returns a range for configurables; show "from" when they differ. */
  maximum?: MoneyLike | null | undefined;
  locale?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
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
    <p
      className={classNames(
        'flex flex-wrap items-baseline gap-x-2 gap-y-1',
        SIZES[size],
        className,
      )}
    >
      <span className="font-semibold text-ink">
        {isRange ? `From ${formatMoney(final, locale)}` : formatMoney(final, locale)}
      </span>
      {discount && regular ? (
        <>
          <span className="text-ink-muted line-through" aria-label="Regular price">
            {formatMoney(regular, locale)}
          </span>
          <span className="rounded-full bg-sale/10 px-2 py-0.5 text-xs font-semibold text-sale">
            −{discount}%
          </span>
        </>
      ) : null}
    </p>
  );
}
