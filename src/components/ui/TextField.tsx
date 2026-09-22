import { useId, type InputHTMLAttributes, type Ref } from 'react';
import { classNames } from '@lib/format';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Shows the required marker and sets the native attribute together. */
  required?: boolean;
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
  required = false,
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
        {required && (
          <>
            {/* The asterisk is decorative; the requirement is carried by the
                native attribute, which is what a screen reader announces. */}
            <span aria-hidden="true" className="ml-0.5 text-danger">
              *
            </span>
          </>
        )}
      </label>
      <input
        {...props}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={classNames(
          // 16px on phones so iOS Safari does not zoom the page on focus.
          'h-11 w-full rounded-control border bg-surface px-3 text-base text-ink sm:h-10 sm:text-sm',
          'transition-colors duration-150 ease-out-soft placeholder:text-ink-muted',
          'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-60',
          error
            ? 'border-danger focus:border-danger'
            : 'border-line-strong hover:border-ink-subtle',
          className,
        )}
      />
      {hint && !error ? (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
      {/* The message sits under its own field and is wired up with
          aria-describedby, so the error reaches the shopper at the control
          that caused it rather than only in a summary at the top. */}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-xs font-medium text-danger"
        >
          {/* Icon as well as colour: the error must survive a monochrome
              skin and colour-blind vision (WCAG 1.4.1). */}
          <svg viewBox="0 0 16 16" className="mt-px size-3.5 shrink-0" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M8 5v3.5M8 10.8v.2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
