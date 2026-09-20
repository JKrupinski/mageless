import { useEffect, useId, useRef, useState } from 'react';
import { formatMoney, type MoneyLike } from '@lib/format';
import { classNames } from '@lib/format';

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
    <div ref={containerRef} className="relative w-full max-w-md">
      <form action="/search" method="get" role="search">
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
          className="h-10 w-full rounded-[--radius-control] border border-border-subtle bg-surface px-3 text-sm text-ink placeholder:text-ink-muted"
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
        className="absolute top-full left-0 z-30 mt-1 w-full overflow-hidden rounded-[--radius-card] border border-border-subtle bg-surface shadow-xl"
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
                'flex cursor-pointer items-center gap-3 p-2',
                index === activeIndex && 'bg-surface-muted',
              )}
            >
              {suggestion.image ? (
                <img
                  src={suggestion.image}
                  alt=""
                  width={40}
                  height={50}
                  loading="lazy"
                  className="h-12 w-10 rounded object-cover"
                />
              ) : null}
              <span className="flex-1 truncate text-sm text-ink">{suggestion.name}</span>
              <span className="text-sm font-medium text-ink-muted">
                {formatMoney(suggestion.price, locale)}
              </span>
            </li>
          ))}
        </ul>

        {totalCount > suggestions.length ? (
          <a
            href={`/search?q=${encodeURIComponent(trimmed)}`}
            className="block border-t border-border-subtle p-2 text-center text-sm font-medium text-brand-700"
          >
            See all {totalCount} results
          </a>
        ) : null}
      </div>
    </div>
  );
}
