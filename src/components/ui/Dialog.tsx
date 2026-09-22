import type { ComponentProps, HTMLAttributes } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { X } from 'lucide-react';
import { classNames } from '@lib/format';

/**
 * Wraps Radix's Dialog primitives with this design system's tokens.
 *
 * Compose Root/Trigger/Content/etc. inside a single `.tsx` file mounted as one
 * Astro island — a compound component like this shares React context between
 * its parts, which does not cross separate `client:*` directives.
 */
function Dialog(props: ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger(props: ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogClose(props: ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={classNames(
        'fixed inset-0 z-50 bg-scrim',
        'data-[state=open]:animate-fade-in motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  );
}

export interface DialogContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  /** Hide the built-in corner close button for content that supplies its own. */
  showCloseButton?: boolean;
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={classNames(
          'fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] sm:max-w-md',
          '-translate-x-1/2 -translate-y-1/2',
          'rounded-panel border border-line bg-surface p-6 text-ink shadow-xl outline-none',
          'data-[state=open]:animate-scale-in motion-reduce:animate-none',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            aria-label="Close"
            className={classNames(
              'absolute top-3.5 right-3.5 inline-flex size-9 cursor-pointer items-center justify-center',
              'rounded-control text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink',
            )}
          >
            <X className="size-4" aria-hidden="true" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-header"
      className={classNames('mb-4 flex flex-col gap-1.5 pr-8', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-footer"
      className={classNames(
        'mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={classNames('text-base font-semibold text-ink', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={classNames('text-sm text-ink-muted', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
