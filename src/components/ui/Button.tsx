import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { classNames } from '@lib/format';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

/**
 * `primary` is an ink fill, not the accent colour. In an editorial storefront
 * the accent is reserved for the single conversion action on a page (`accent`,
 * used by Add to cart) so it keeps meaning something; every other affirmative
 * button is black-on-white and stays out of the product photography's way.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-on-ink hover:bg-ink-hover active:bg-ink',
  accent: 'bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-active',
  secondary: 'border border-line-strong bg-surface text-ink hover:bg-surface-hover',
  ghost: 'text-ink hover:bg-surface-hover',
  danger: 'border border-danger/40 text-danger hover:bg-danger-soft',
  link: 'text-accent-text underline underline-offset-4 hover:decoration-2',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 px-3 text-sm',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-base',
  icon: 'size-10 gap-0',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a spinner, disables the control and announces the busy state. */
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classNames(
        'inline-flex cursor-pointer items-center justify-center rounded-control font-medium',
        'whitespace-nowrap transition-[background-color,border-color,color,box-shadow]',
        'duration-150 ease-out-soft touch-manipulation select-none',
        // The pressed state is a 1% scale, not a colour shift: it reads on
        // every variant including the two that have no fill to darken.
        'active:scale-[0.99] motion-reduce:active:scale-100',
        'disabled:pointer-events-none disabled:opacity-45',
        variant === 'link' ? 'h-auto px-0' : SIZES[size],
        VARIANTS[variant],
        fullWidth && 'w-full',
        className,
      )}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
