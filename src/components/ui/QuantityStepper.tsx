import { useId } from 'react';
import { classNames } from '@lib/format';

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
}

/**
 * A real `<input type="number">` wrapped in buttons: keyboard users get native
 * arrow-key stepping, and the +/− controls carry their own accessible names.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  label = 'Quantity',
  className,
}: QuantityStepperProps) {
  const inputId = useId();
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div className={classNames('inline-flex items-stretch', className)}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
        aria-label="Decrease quantity"
        className="size-10 rounded-l-[--radius-control] border border-border-subtle text-lg leading-none text-ink disabled:opacity-40"
      >
        −
      </button>
      <input
        id={inputId}
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(event) => {
          const next = Number.parseInt(event.target.value, 10);
          onChange(Number.isNaN(next) ? min : clamp(next));
        }}
        className="h-10 w-14 border-y border-border-subtle bg-surface text-center text-sm text-ink [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1))}
        aria-label="Increase quantity"
        className="size-10 rounded-r-[--radius-control] border border-border-subtle text-lg leading-none text-ink disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
