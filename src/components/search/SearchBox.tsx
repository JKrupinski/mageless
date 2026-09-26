import { useEffect, useId, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { classNames, formatMoney, type MoneyLike } from '@lib/format';
import { Picture } from '@ui/Picture';
import { IMAGE_PRESETS } from '@lib/images';

interface Suggestion {
  uid: string;
  name: string;
  url: string;
  image: string | null;
  price: MoneyLike;
}

export interface SearchBoxProps {
  initialTerm?: string;
  locale?: string;
  placeholder?: string;
}

/**
 * Type-ahead search following the ARIA combobox pattern.
 *
 * The form is a plain `GET /search`, so it works before this island hydrates
 * and with JavaScript switched off entirely — the island only adds suggestions
 * on top. Submitting is deliberately *not* intercepted: an island that
 * preventDefault()s the submit loses whatever the shopper typed during the
 * hydration gap. The term is validated with Zod on the server instead
 * (see `src/pages/search.astro`).
 */
export function SearchBox({
  initialTerm = '',
  locale = 'en-US',
  placeholder = 'Search products…',
}: SearchBoxProps) {
  const listboxId = useId();
  const [term, setTerm] = useState(initialTerm);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  // Suggestions are only fetched once the shopper actually types. Landing on
  // /search?q=jacket pre-fills the input, and a popup opening by itself over
  // the results the shopper just asked for would be user-hostile.
  const [touched, setTouched] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const trimmed = term.trim();
  /*
   * Whether the list is showing is derived, not stored: it depends on the term,
   * what came back, and whether the shopper dismissed it. Deriving keeps the
   * effect free of synchronous setState, which would cascade a second render
   * on every keystroke.
   */
  const open = touched && !dismissed && trimmed.length >= 2 && suggestions.length > 0;

  useEffect(() => {
    if (!touched || trimmed.length < 2) return;

    // Debounce keystrokes and cancel the in-flight request, so a fast typist
    // never pays for the suggestions they already typed past.
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          suggestions: Suggestion[];
          totalCount: number;
        };
        setSuggestions(payload.suggestions);
        setTotalCount(payload.totalCount);
        setActiveIndex(-1);
      } catch {
        /* aborted or offline — leave the previous suggestions in place */
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [trimmed, touched]);

  useEffect(() => {
    const onClickAway = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setDismissed(true);
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      // Only an explicitly highlighted suggestion overrides the form submit.
      event.preventDefault();
      const target = suggestions[activeIndex];
      if (target) window.location.href = target.url;
    } else if (event.key === 'Escape') {
      setDismissed(true);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form action="/search" method="get" role="search" className="relative">
        {/* Decorative: the field already has a visible label for assistive
            technology via the sr-only <label> below. */}
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle"
          aria-hidden="true"
        />
        <label htmlFor={`${listboxId}-input`} className="sr-only">
          Search products
        </label>
        <input
          id={`${listboxId}-input`}
          name="q"
          type="search"
          role="combobox"
          autoComplete="off"
          defaultValue={initialTerm}
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          placeholder={placeholder}
          onChange={(event) => {
            setTerm(event.target.value);
            setTouched(true);
            setDismissed(false);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setDismissed(false)}
          className={classNames(
            'h-10 w-full rounded-control border border-line bg-surface-sunken py-2 pr-3 pl-9',
            // 16px on phones: anything smaller makes iOS Safari zoom the page
            // on focus and the shopper has to pinch back out.
            'text-base sm:text-sm text-ink placeholder:text-ink-muted',
            'transition-colors duration-150 ease-out-soft',
            'hover:border-line-strong focus:border-line-strong focus:bg-surface',
            // The browser's own clear button is styled per-platform and sits
            // at a different offset in each; ours is not needed because the
            // field is short-lived.
            '[&::-webkit-search-cancel-button]:cursor-pointer',
          )}
        />
      </form>

      {/*
        A listbox may only contain options, and an option may not contain
        anything focusable — so the suggestions are not links. Selection is
        driven by click and by the arrow keys above, and the "see all" escape
        hatch lives outside the listbox as an ordinary link.
      */}
      <div
        hidden={!open}
        className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-panel border border-line bg-surface shadow-xl"
      >
        <ul id={listboxId} role="listbox" aria-label="Search suggestions">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.uid}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={() => {
                window.location.href = suggestion.url;
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={classNames(
                'flex cursor-pointer items-center gap-3 p-2 transition-colors',
                index === activeIndex && 'bg-surface-hover',
              )}
            >
              {suggestion.image ? (
                <Picture
                  src={suggestion.image}
                  preset={IMAGE_PRESETS.suggestion}
                  alt=""
                  width={40}
                  height={50}
                  loading="lazy"
                  className="h-12 w-10 shrink-0 rounded-control bg-surface-sunken object-cover"
                />
              ) : null}
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{suggestion.name}</span>
              <span className="numeric shrink-0 text-sm font-medium text-ink">
                {formatMoney(suggestion.price, locale)}
              </span>
            </li>
          ))}
        </ul>

        {totalCount > suggestions.length ? (
          <a
            href={`/search?q=${encodeURIComponent(trimmed)}`}
            className="block border-t border-line p-2.5 text-center text-sm font-medium text-accent-text transition-colors hover:bg-surface-hover"
          >
            See all {totalCount} results
          </a>
        ) : null}
      </div>
    </div>
  );
}
