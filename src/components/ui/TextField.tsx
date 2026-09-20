import { useId, type InputHTMLAttributes, type Ref } from 'react';
import { classNames } from '@lib/format';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Message from the validation schema; also wires up aria-describedby. */
  error?: string | undefined;
  hint?: string | undefined;
  /** Hide the label visually but keep it for screen readers. */
  labelHidden?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function TextField({
  label,
  error,
  hint,
  labelHidden = false,
  className,
  id,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className={classNames('text-sm font-medium text-ink', labelHidden && 'sr-only')}
      >
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={classNames(
          'h-10 w-full rounded-[--radius-control] border bg-surface px-3 text-sm text-ink',
          'placeholder:text-ink-muted',
          error ? 'border-danger' : 'border-border-subtle',
          className,
        )}
      />
      {hint && !error ? (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
