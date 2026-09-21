import type { ComponentProps } from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { classNames } from '@lib/format';

/**
 * Wraps Radix's RadioGroup primitives with this design system's tokens.
 * Compose Root/Item inside a single `.tsx` file mounted as one Astro island —
 * see the note on `Dialog.tsx`.
 */
function RadioGroup({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={classNames('grid gap-2', className)}
      {...props}
    />
  );
}

function RadioGroupItem({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={classNames(
        'flex aspect-square size-4 shrink-0 items-center justify-center rounded-full border border-border-subtle',
        'data-[state=checked]:border-brand-600 data-[state=checked]:bg-brand-600',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator>
        <span className="block size-1.5 rounded-full bg-white" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
