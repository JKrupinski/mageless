import { useId } from 'react';
import { Minus, Plus } from 'lucide-react';
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

const STEP_BUTTON = [
  'inline-flex size-10 shrink-0 cursor-pointer items-center justify-center text-ink',
  'transition-colors duration-150 ease-out-soft hover:bg-surface-hover',
  'disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent',
].join(' ');

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
    // The border is on the group, not on each part: three adjacent bordered
    // boxes render a 2px seam between them at most zoom levels.
    <div
      className={classNames(
        'inline-flex items-stretch overflow-hidden rounded-control border border-line-strong bg-surface',
        disabled && 'opacity-60',
        className,
      )}
    >
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
        aria-label="Decrease quantity"
        className={STEP_BUTTON}
      >
        <Minus className="size-4" aria-hidden="true" />
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
        className={classNames(
          'numeric h-10 w-12 border-x border-line bg-transparent text-center text-sm font-medium text-ink',
          // The native spinners duplicate the two buttons either side of the
          // field and shrink the usable hit area of the input itself.
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
        )}
      />
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1))}
        aria-label="Increase quantity"
        className={STEP_BUTTON}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
