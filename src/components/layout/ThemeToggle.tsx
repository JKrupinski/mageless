import { useSyncExternalStore } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { classNames } from '@lib/format';

type Theme = 'system' | 'light' | 'dark';

const ORDER: Theme[] = ['system', 'light', 'dark'];
const STORAGE_KEY = 'mageless:theme';

const ICONS = { system: Monitor, light: Sun, dark: Moon } as const;
const LABELS = { system: 'System', light: 'Light', dark: 'Dark' } as const;

/**
 * The stored preference is external state that the inline boot script in
 * BaseLayout has already applied to `<html data-theme>` by the time React
 * runs. Reading it through `useSyncExternalStore` rather than a state-setting
 * effect means the component never renders a value it then has to correct,
 * and it stays in sync when another tab changes the preference.
 */
function subscribe(onChange: () => void) {
  // `storage` fires in *other* tabs, so a second window follows along.
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    // Private mode or blocked storage: the OS preference still applies.
    return 'system';
  }
}

/** There is no preference to read on the server, and none during the first
 *  hydration pass — both must agree or React discards the markup. */
const serverTheme = (): Theme => 'system';

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);

  function apply(next: Theme) {
    const root = document.documentElement;
    try {
      if (next === 'system') {
        root.removeAttribute('data-theme');
        localStorage.removeItem(STORAGE_KEY);
      } else {
        root.setAttribute('data-theme', next);
        localStorage.setItem(STORAGE_KEY, next);
      }
    } catch {
      // Storage refused the write; the attribute change still applies for
      // this page view, it just will not be remembered.
      if (next === 'system') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', next);
    }
    // `storage` does not fire in the tab that wrote it.
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
  }

  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length] ?? 'system';
  const Icon = ICONS[theme];

  return (
    <button
      type="button"
      onClick={() => apply(next)}
      aria-label={`Theme: ${LABELS[theme]}. Switch to ${LABELS[next].toLowerCase()}.`}
      title={`Theme: ${LABELS[theme]}`}
      className={classNames(
        'inline-flex size-9 cursor-pointer items-center justify-center rounded-control text-ink-muted',
        'transition-colors duration-150 ease-out-soft hover:bg-surface-hover hover:text-ink',
        className,
      )}
    >
      <Icon className="size-[1.125rem]" aria-hidden="true" />
    </button>
  );
}
