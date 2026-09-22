import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useStore } from '@nanostores/react';
import {
  addToCartSchema,
  type AddToCartFieldValues,
  type AddToCartValues,
} from '@lib/cart/schemas';
import { $cartError, $cartStatus, addToCart, openCartDrawer } from '@lib/stores/cart';
import { Button } from '@ui/Button';
import { QuantityStepper } from '@ui/QuantityStepper';
import { Price } from '@ui/Price';
import { classNames, type MoneyLike } from '@lib/format';

export interface OptionValueProp {
  uid: string;
  label: string;
  /** Hex colour for swatch attributes; plain text options leave this null. */
  swatch: string | null;
}

export interface ConfigurableOptionProp {
  uid: string;
  attributeCode: string;
  label: string;
  values: OptionValueProp[];
}

export interface VariantProp {
  /** The option UIDs this variant is the intersection of. */
  optionUids: string[];
  sku: string;
  inStock: boolean;
  final: MoneyLike | null;
  regular: MoneyLike | null;
  percentOff: number | null;
}

export interface AddToCartFormProps {
  sku: string;
  name: string;
  inStock: boolean;
  locale?: string;
  options?: ConfigurableOptionProp[];
  variants?: VariantProp[];
  /** Price shown before a variant narrows it down. */
  final: MoneyLike | null;
  regular: MoneyLike | null;
  percentOff: number | null;
  maximum?: MoneyLike | null;
}

/**
 * The one genuinely interactive part of a product page, so it is the only part
 * shipped as a hydrated island. Everything around it — gallery markup,
 * description, breadcrumbs, SEO — stays server-rendered HTML.
 */
export function AddToCartForm({
  sku,
  name,
  inStock,
  locale = 'en-US',
  options = [],
  variants = [],
  final,
  regular,
  percentOff,
  maximum,
}: AddToCartFormProps) {
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const status = useStore($cartStatus);
  const storeError = useStore($cartError);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    // The three generics keep the field values (pre-coercion) and the submitted
    // values (post-coercion) as separate types, which is what makes
    // `z.coerce.number()` safe to share between this form and the API route.
  } = useForm<AddToCartFieldValues, unknown, AddToCartValues>({
    resolver: zodResolver(addToCartSchema),
    defaultValues: { sku, quantity: 1 },
  });

  const quantity = Number(watch('quantity') ?? 1);
  const selectedUids = useMemo(() => Object.values(selection), [selection]);
  const allOptionsChosen = options.length > 0 && selectedUids.length === options.length;

  const selectedVariant = useMemo(() => {
    if (!allOptionsChosen) return null;
    return (
      variants.find((variant) => selectedUids.every((uid) => variant.optionUids.includes(uid))) ??
      null
    );
  }, [allOptionsChosen, selectedUids, variants]);

  /**
   * Grey out combinations Magento has no variant for, rather than letting the
   * shopper pick one and hit an error on submit.
   *
   * Reachability is computed per attribute: for each option we hold the *other*
   * attributes fixed at what is currently selected, and keep only the values
   * some variant still offers under that constraint.
   */
  const reachableByAttribute = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (variants.length === 0) return map;

    for (const option of options) {
      const otherSelections = Object.entries(selection)
        .filter(([code]) => code !== option.attributeCode)
        .map(([, uid]) => uid);
      const reachable = new Set<string>();

      for (const variant of variants) {
        if (!otherSelections.every((uid) => variant.optionUids.includes(uid))) continue;
        for (const value of option.values) {
          if (variant.optionUids.includes(value.uid)) reachable.add(value.uid);
        }
      }

      map.set(option.attributeCode, reachable);
    }

    return map;
  }, [options, selection, variants]);

  const effectivePrice = selectedVariant
    ? {
        final: selectedVariant.final,
        regular: selectedVariant.regular,
        percentOff: selectedVariant.percentOff,
      }
    : { final, regular, percentOff };

  const purchasable = options.length === 0 ? inStock : Boolean(selectedVariant?.inStock);
  const missingSelection = options.length > 0 && !allOptionsChosen;

  const onSubmit = handleSubmit(async (values) => {
    setConfirmation(null);
    try {
      await addToCart({
        sku: values.sku,
        quantity: values.quantity,
        ...(selectedUids.length > 0 ? { selectedOptions: selectedUids } : {}),
      });
      setConfirmation(`${name} added to your cart.`);
      openCartDrawer();
    } catch {
      /* the error is already in the store and rendered below */
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <Price
        size="lg"
        final={effectivePrice.final}
        regular={effectivePrice.regular}
        percentOff={effectivePrice.percentOff}
        maximum={selectedVariant ? null : maximum}
        locale={locale}
      />

      {options.map((option) => (
        <fieldset key={option.uid} className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-ink">
            {option.label}
            {selection[option.attributeCode] ? (
              <span className="ml-2 font-normal text-ink-muted">
                {
                  option.values.find((value) => value.uid === selection[option.attributeCode])
                    ?.label
                }
              </span>
            ) : null}
          </legend>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const isSelected = selection[option.attributeCode] === value.uid;
              const reachable = reachableByAttribute.get(option.attributeCode);
              const isReachable = !reachable || reachable.has(value.uid);
              return (
                <label
                  key={value.uid}
                  className={classNames(
                    'relative cursor-pointer rounded-control border px-3 py-2 text-sm transition-colors',
                    isSelected
                      ? 'border-accent bg-accent-soft text-accent-text'
                      : 'border-line text-ink hover:bg-surface-hover',
                    !isReachable && 'cursor-not-allowed opacity-40 line-through',
                    'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
                  )}
                >
                  <input
                    type="radio"
                    /* Stretched over the label so the whole chip is the hit
                       target, while staying a real radio for assistive tech. */
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                    name={option.attributeCode}
                    value={value.uid}
                    checked={isSelected}
                    disabled={!isReachable}
                    onChange={() =>
                      setSelection((current) => ({
                        ...current,
                        [option.attributeCode]: value.uid,
                      }))
                    }
                  />
                  {value.swatch ? (
                    <span className="pointer-events-none flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        style={{ backgroundColor: value.swatch }}
                        className="size-4 rounded-full border border-line"
                      />
                      {value.label}
                    </span>
                  ) : (
                    value.label
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper
          value={quantity}
          onChange={(next) => setValue('quantity', next, { shouldValidate: true })}
          disabled={!inStock}
        />
        <Button
          type="submit"
          variant="accent"
          size="lg"
          loading={status === 'pending'}
          disabled={!purchasable || missingSelection}
          className="flex-1"
        >
          {missingSelection ? 'Select options' : purchasable ? 'Add to cart' : 'Out of stock'}
        </Button>
      </div>

      {errors.quantity ? (
        <p role="alert" className="text-sm text-danger">
          {errors.quantity.message}
        </p>
      ) : null}

      {/* Status messages are announced without stealing focus. */}
      <p aria-live="polite" className="min-h-5 text-sm">
        {status === 'error' && storeError ? (
          <span className="text-danger">{storeError}</span>
        ) : confirmation ? (
          <span className="text-success">{confirmation}</span>
        ) : null}
      </p>
    </form>
  );
}
