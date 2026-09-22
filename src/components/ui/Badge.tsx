import type { ReactNode } from 'react';
import { classNames } from '@lib/format';

export type BadgeTone = 'neutral' | 'success' | 'sale' | 'danger' | 'warning' | 'accent';

/**
 * Each tone pairs a `-soft` background with its full-strength text colour, so
 * the two can never drift apart in a re-skin: change `--sale` and the label
 * moves with the chip.
 */
const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-ink-muted',
  success: 'bg-success-soft text-success',
  sale: 'bg-sale text-on-ink',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  accent: 'bg-accent-soft text-accent-text',
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-control px-2 py-0.5',
        'text-[0.6875rem] font-semibold tracking-wide uppercase',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
