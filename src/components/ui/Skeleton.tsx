import { classNames } from '@lib/format';

export interface SkeletonProps {
  className?: string;
  /** Reserve the final layout size so the placeholder does not shift the page. */
  aspect?: string;
}

export function Skeleton({ className, aspect }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      style={aspect ? { aspectRatio: aspect } : undefined}
      className={classNames('animate-pulse rounded-[--radius-card] bg-surface-inset', className)}
    />
  );
}
