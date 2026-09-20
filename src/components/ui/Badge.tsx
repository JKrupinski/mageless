import type { ReactNode } from 'react';
import { classNames } from '@lib/format';

export type BadgeTone = 'neutral' | 'success' | 'sale' | 'danger';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-inset text-ink-muted',
  success: 'bg-success/12 text-success',
  sale: 'bg-sale/12 text-sale',
  danger: 'bg-danger/12 text-danger',
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
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
